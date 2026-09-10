import { Router } from 'express';
import { isPullActive } from '../services/ingestionWorker.js';
import { isSupabaseConfigured } from '../services/supabaseClient.js';

export const chatRouter = Router();

const SYSTEM_INSTRUCTION = `You are TradeOps Copilot, the intelligent telemetry, analytics, and operations assistant for the BSE TradeOps platform.
You represent the BSE TradeOps system — a production-grade live trade ingestion terminal engineered to ingest large, slow, chunked exchange feeds under a strict 30-second network connection ceiling with zero client polling.

System Knowledge Base:
- Traded Symbols (18 Indian Equities): RELIANCE, TCS, HDFCBANK, INFY, ICICIBANK, HINDUNILVR, BHARTIARTL, SBIN, BAJFINANCE, LT, ASIANPAINT, MARUTI, AXISBANK, ITC, KOTAKBANK, SUNPHARMA, TITAN, WIPRO.
- Institutional Clients (10 Brokerages/Funds): Ashoka Capital, Vertex Securities, Meridian Advisors, Northgate Fund, Silverline Partners, Crown Point Holdings, Blue Harbor AMC, Ridgeline Trading, Anchor Point Investments, Delta Bridge Capital.
- Dashboard Navigation:
  * / (Landing Page): Overview of the streaming pipeline and architecture guarantees.
  * /live (Live Terminal): Real-time trade streaming, throughput velocity, top symbol stats, and start pull controls.
  * /trades (Trades Explorer): Full tabular inspection with search, multi-criteria filters, and detailed trade drawer.
  * /pipeline (Pipeline Telemetry): Ingestion node topology, chunk progression, and <30s ceiling compliance metrics.
  * /analytics (Analytics Studio): Volume distribution charts, institutional client market share, and hourly heatmaps.
  * /runs & /runs/:id (Run Audit): Historical records of past pull runs.

Telemetry & Financial Metrics Interpretation:
- You have access to detailed telemetry in the provided JSON snapshot:
  * marketFinancials: totalLoadedTrades, totalTurnoverINR, averageTradePriceINR, tradesPerMinuteVelocity, and highestValueTrade.
  * topSymbols: symbols ranked by total quantity traded.
  * topClients: institutional clients ranked by volume, trade count, and total turnover in INR.
  * pullRun: current ingestion run status, progress percentage, chunks processed vs expected, and error messages.
  * currentTerminalState: the active UI route the user is looking at and current realtime transport mode.
  * backendEngine: server uptime, active ingestion lock state, and Supabase connection status.

Core Directives:
1. Grounded Factual Accuracy: Always ground your answers in the numbers, symbols, and status provided in the snapshot. Never invent figures or fabricate trades. If no trades have been loaded, clearly state that.
2. Response Style: Clean, concise, telemetry-focused markdown with bullet points and bold numbers.
3. Architecture Principles:
   - Chunked Pagination: /getTrades requests 100 trades/chunk, always completing well under the 30-second network ceiling.
   - Zero Polling: The frontend never polls; data is pushed in real time via WebSockets or SSE.
4. Security & Compliance: Do not execute orders, alter database records, or provide personalized financial investment advice.`;

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

chatRouter.post('/chat', async (req, res) => {
  const { message, history = [], context = {} } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Message text is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

  if (!apiKey || apiKey.includes('your-key')) {
    return res.json({
      reply:
        "⚠️ Gemini API Key is not configured in `backend/.env`. Please set `GEMINI_API_KEY` to enable live TradeOps Copilot responses. I can still answer that our architecture uses chunked requests under the 30-second connection limit with zero client polling!",
    });
  }

  try {
    const enrichedContext = {
      backendEngine: {
        isPullActive: isPullActive(),
        supabaseConnected: isSupabaseConfigured,
        serverUptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      },
      ...context,
    };

    const formattedContext = JSON.stringify(enrichedContext, null, 2);

    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: `Current System Context Snapshot:\n\`\`\`json\n${formattedContext}\n\`\`\`\n\nUser Question: ${message.trim()}`,
          },
        ],
      },
    ];

    if (Array.isArray(history) && history.length > 0) {
      const historyParts = history.slice(-6).map((h: { role: string; content: string }) => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.content }],
      }));
      contents.unshift(...historyParts);
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        contents,
        systemInstruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }],
        },
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 800,
        },
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Gemini API returned status ${response.status}:`, errText);
      if (response.status === 429) {
        return res.status(429).json({
          reply: 'I am receiving too many requests right now. Please wait a moment and try again.',
        });
      }
      return res.status(500).json({
        reply: 'I encountered an error connecting to the AI provider. Please try again shortly.',
      });
    }

    const data = (await response.json()) as GeminiResponse;
    const candidateText =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      'I was unable to generate a response. Please try rephrasing your question.';

    return res.json({ reply: candidateText });
  } catch (err) {
    console.error('Chat API Error:', err);
    return res.status(500).json({
      reply: 'I couldn’t reach the TradeOps Copilot assistant right now. Please try again.',
    });
  }
});
