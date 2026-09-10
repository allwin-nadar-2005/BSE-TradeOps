import { useMemo, useState } from 'react';
import { Bot, MessageSquare } from 'lucide-react';
import { ChatWindow } from './ChatWindow';
import { useTradesRealtime } from '../../hooks/useTradesRealtime';
import { usePullStatus } from '../../hooks/usePullStatus';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import { sendChatMessage, type ChatMessageItem } from '../../lib/chatApi';

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [loading, setLoading] = useState(false);

  const { trades } = useTradesRealtime();
  const { pullRun } = usePullStatus();

  // Compute rich real-time context snapshot from telemetry and operational state
  const contextSnapshot = useMemo(() => {
    const symbolMap = new Map<string, number>();
    const clientMap = new Map<string, { volume: number; count: number; totalValue: number }>();
    let totalTurnover = 0;
    let highestTrade = {
      trade_id: '—',
      symbol: '—',
      client: '—',
      totalValueINR: 0,
      quantity: 0,
      price: 0,
    };

    trades.forEach((t) => {
      // Symbol aggregation
      symbolMap.set(t.symbol, (symbolMap.get(t.symbol) ?? 0) + t.quantity);

      // Client aggregation
      const existingClient = clientMap.get(t.client) ?? { volume: 0, count: 0, totalValue: 0 };
      const tradeValue = t.quantity * t.price;
      totalTurnover += tradeValue;

      clientMap.set(t.client, {
        volume: existingClient.volume + t.quantity,
        count: existingClient.count + 1,
        totalValue: existingClient.totalValue + tradeValue,
      });

      if (tradeValue > highestTrade.totalValueINR) {
        highestTrade = {
          trade_id: t.trade_id,
          symbol: t.symbol,
          client: t.client,
          totalValueINR: Math.round(tradeValue * 100) / 100,
          quantity: t.quantity,
          price: t.price,
        };
      }
    });

    const topSymbols = [...symbolMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([symbol, volume]) => ({ symbol, volume }));

    const topClients = [...clientMap.entries()]
      .sort((a, b) => b[1].volume - a[1].volume)
      .slice(0, 5)
      .map(([client, data]) => ({
        client,
        volume: data.volume,
        tradeCount: data.count,
        totalValueINR: Math.round(data.totalValue * 100) / 100,
      }));

    // Trade velocity calculation (trades/min)
    let tradesPerMinute = 0;
    if (trades.length > 1) {
      const oldest = trades[trades.length - 1];
      const newest = trades[0];
      const spanMinutes = Math.max(
        1 / 60,
        (new Date(newest.created_at).getTime() - new Date(oldest.created_at).getTime()) / 60000
      );
      tradesPerMinute = Math.round(trades.length / spanMinutes);
    }

    // Recent 10 trades
    const recentTrades = trades.slice(0, 10).map((t) => ({
      trade_id: t.trade_id,
      client: t.client,
      symbol: t.symbol,
      quantity: t.quantity,
      price: t.price,
      trade_timestamp: t.trade_timestamp,
    }));

    const totalTradesExpected = pullRun?.total_trades ?? 4800;
    const ingestedCount = pullRun?.ingested_count ?? trades.length;
    const chunkSize = pullRun?.chunk_size ?? 100;
    const progressPercentage =
      totalTradesExpected > 0
        ? Math.min(100, Math.round((ingestedCount / totalTradesExpected) * 100))
        : 0;

    return {
      pullRun: pullRun
        ? {
            id: pullRun.id,
            status: pullRun.status,
            total_trades: pullRun.total_trades,
            ingested_count: pullRun.ingested_count,
            chunk_size: pullRun.chunk_size,
            started_at: pullRun.started_at,
            completed_at: pullRun.completed_at,
            error_message: pullRun.error_message,
            progressPercentage,
            chunksProcessed: Math.ceil(ingestedCount / chunkSize),
            totalChunksExpected: Math.ceil(totalTradesExpected / chunkSize),
          }
        : null,
      marketFinancials: {
        totalLoadedTrades: trades.length,
        totalTurnoverINR: Math.round(totalTurnover * 100) / 100,
        averageTradePriceINR:
          trades.length > 0
            ? Math.round(
                (totalTurnover /
                  trades.reduce((acc, t) => acc + t.quantity, 0)) *
                  100
              ) / 100
            : 0,
        tradesPerMinuteVelocity: tradesPerMinute,
        highestValueTrade: highestTrade.totalValueINR > 0 ? highestTrade : null,
      },
      topSymbols,
      topClients,
      recentTrades,
      currentTerminalState: {
        activeRoute: typeof window !== 'undefined' ? window.location.pathname : '/',
        clientRealtimeMode: isSupabaseConfigured
          ? 'Supabase Postgres Realtime (WebSockets)'
          : 'Backend SSE Stream (Local Fallback)',
        clientPolling: 'Disabled / Zero Polling',
      },
      architectureFacts: {
        connectionCeilingSeconds: 30,
        chunkSize,
        chunkDelayMs: 1500,
        retryPolicy: 'Up to 2 retries with exponential backoff (500ms * attempt)',
        ingestionStrategy: 'Sequential chunk offset pagination over /getTrades',
        pushMechanism: isSupabaseConfigured
          ? 'Supabase Realtime publication (supabase_realtime)'
          : 'Server-Sent Events (/api/events)',
      },
    };
  }, [trades, pullRun]);

  async function handleSendMessage(userMessageText: string) {
    if (!userMessageText.trim() || loading) return;

    const userMessage: ChatMessageItem = { role: 'user', content: userMessageText.trim() };
    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    setLoading(true);

    try {
      const res = await sendChatMessage({
        message: userMessageText.trim(),
        history: updatedHistory,
        context: contextSnapshot,
      });

      const assistantMessage: ChatMessageItem = { role: 'assistant', content: res.reply };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'I couldn’t reach the assistant. Please try again.';
      setMessages((prev) => [...prev, { role: 'assistant', content: `⚠️ ${errorMessage}` }]);
    } finally {
      setLoading(false);
    }
  }

  function handleClearChat() {
    setMessages([]);
  }

  return (
    <>
      {/* FLOATING CHAT BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-ink-800 hover:bg-ink-700 text-paper-100 border border-brass-500/40 hover:border-brass-400 font-mono text-xs shadow-2xl transition-all hover:scale-105 active:scale-95 group"
      >
        <div className="relative flex items-center justify-center">
          <Bot className="w-4 h-4 text-brass-400 group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400"></span>
          </span>
        </div>
        <span className="font-bold">TradeOps AI</span>
      </button>

      {/* CHAT WINDOW */}
      <ChatWindow
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        messages={messages}
        loading={loading}
        onSendMessage={handleSendMessage}
        onClearChat={handleClearChat}
      />
    </>
  );
}
