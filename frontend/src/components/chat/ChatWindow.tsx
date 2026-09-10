import { useEffect, useRef } from 'react';
import { Bot, X, Trash2, Loader2, Sparkles } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { SuggestedPrompts } from './SuggestedPrompts';
import type { ChatMessageItem } from '../../lib/chatApi';

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessageItem[];
  loading: boolean;
  onSendMessage: (text: string) => void;
  onClearChat: () => void;
}

export function ChatWindow({
  isOpen,
  onClose,
  messages,
  loading,
  onSendMessage,
  onClearChat,
}: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-20 right-4 sm:right-6 w-[calc(100vw-32px)] sm:w-[380px] h-[520px] max-h-[calc(100vh-100px)] bg-ink-800 border border-ink-600 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden font-sans backdrop-blur-xl">
      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-3 bg-ink-950/90 border-b border-ink-600">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brass-500/10 border border-brass-500/30 flex items-center justify-center text-brass-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-serif text-sm font-bold text-paper-100">TradeOps Copilot</h3>
              <span className="text-[9px] font-mono bg-teal-400/10 text-teal-400 border border-teal-400/30 px-1.5 py-0.2 rounded font-semibold">
                AI
              </span>
            </div>
            <p className="text-[10px] text-paper-400">System Observability Assistant</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={onClearChat}
              title="Clear Session Messages"
              className="p-1.5 rounded-lg text-paper-400 hover:text-paper-100 hover:bg-ink-700 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-paper-400 hover:text-paper-100 hover:bg-ink-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MESSAGES BODY AREA */}
      <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="space-y-4 pt-2">
            <div className="bg-ink-900/80 rounded-xl p-3.5 border border-ink-600 text-xs space-y-2">
              <div className="flex items-center gap-1.5 text-brass-400 font-serif font-bold">
                <Sparkles className="w-4 h-4" />
                <span>Welcome to TradeOps Copilot</span>
              </div>
              <p className="text-paper-400 text-[11px] leading-relaxed">
                Ask me about current pull status, trade volumes, top symbols, architecture choices, or why the pipeline uses sub-30s chunked connections.
              </p>
            </div>
            <SuggestedPrompts onSelect={onSendMessage} />
          </div>
        ) : (
          messages.map((m, i) => <ChatMessage key={i} message={m} />)
        )}

        {/* LOADING INDICATOR */}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-brass-400 font-mono bg-ink-900/60 p-2.5 rounded-lg border border-ink-600/60 w-fit">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Analyzing system context...</span>
          </div>
        )}
      </div>

      {/* FOOTER INPUT */}
      <ChatInput onSend={onSendMessage} loading={loading} />
    </div>
  );
}
