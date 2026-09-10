import { Router } from 'express';

export const chatRouter = Router();

const SYSTEM_INSTRUCTION = `You are TradeOps Copilot for the BSE TradeOps dashboard.
Answer questions about the dashboard, trade ingestion pipeline, current pull status, trade summaries, analytics, and system architecture using the supplied context.
Be concise, factual, and easy to understand.
Never invent trade values or system status. If the supplied context does not contain the answer, say that the information is not currently available.
Do not place trades, start ingestion runs, modify/delete database records, or perform any financial transaction. Do not give personalized investment advice.
When explaining the architecture, preserve these facts: the ingestion worker uses short-lived chunk requests (under the 30-second network ceiling), writes chunks as they arrive, and the dashboard receives data through realtime mechanisms rather than a client polling loop.`;

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
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  if (!apiKey || apiKey.includes('your-key')) {
    return res.json({
      reply:
        "⚠️ Gemini API Key is not configured in `backend/.env`. Please set `GEMINI_API_KEY` to enable live TradeOps Copilot responses. I can still answer that our architecture uses chunked requests under the 30-second connection limit with zero client polling!",
    });
  }

  try {
    const formattedContext = JSON.stringify(context, null, 2);

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
