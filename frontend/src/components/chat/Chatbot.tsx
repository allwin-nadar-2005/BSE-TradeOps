import { useMemo, useState } from 'react';
import { Bot, MessageSquare } from 'lucide-react';
import { ChatWindow } from './ChatWindow';
import { useTradesRealtime } from '../../hooks/useTradesRealtime';
import { usePullStatus } from '../../hooks/usePullStatus';
import { sendChatMessage, type ChatMessageItem } from '../../lib/chatApi';

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [loading, setLoading] = useState(false);

  const { trades } = useTradesRealtime();
  const { pullRun } = usePullStatus();

  // Compute small compact context snapshot from existing local state
  const contextSnapshot = useMemo(() => {
    // Top 5 symbols calculation
    const symbolMap = new Map<string, number>();
    trades.forEach((t) => {
      symbolMap.set(t.symbol, (symbolMap.get(t.symbol) ?? 0) + t.quantity);
    });
    const topSymbols = [...symbolMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([symbol, volume]) => ({ symbol, volume }));

    // Recent 10 trades
    const recentTrades = trades.slice(0, 10).map((t) => ({
      trade_id: t.trade_id,
      client: t.client,
      symbol: t.symbol,
      quantity: t.quantity,
      price: t.price,
      trade_timestamp: t.trade_timestamp,
    }));

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
          }
        : null,
      totalLoadedTrades: trades.length,
      topSymbols,
      recentTrades,
      architectureFacts: {
        connectionCeilingSeconds: 30,
        chunkSize: pullRun?.chunk_size ?? 100,
        pushMechanism: 'Supabase Postgres Realtime WebSockets',
        clientPolling: 'Disabled / Zero Polling',
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
