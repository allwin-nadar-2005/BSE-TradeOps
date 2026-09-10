import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  loading: boolean;
}

export function ChatInput({ onSend, loading }: ChatInputProps) {
  const [text, setText] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || loading) return;
    onSend(text.trim());
    setText('');
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 bg-ink-950 border-t border-ink-600">
      <input
        type="text"
        placeholder="Ask Copilot about ingestion, trades, status..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={loading}
        className="flex-1 bg-ink-900 text-paper-100 text-xs font-sans px-3 py-2 rounded-lg border border-ink-600 focus:border-brass-400 focus:outline-none placeholder:text-paper-400 disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={!text.trim() || loading}
        className="p-2 rounded-lg bg-brass-500 hover:bg-brass-400 disabled:bg-ink-700 text-ink-950 disabled:text-paper-400 transition-all shrink-0"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin text-brass-400" /> : <Send className="w-4 h-4" />}
      </button>
    </form>
  );
}
