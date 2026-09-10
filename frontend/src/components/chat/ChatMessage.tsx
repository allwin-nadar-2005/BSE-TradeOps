import { Bot, User } from 'lucide-react';
import type { ChatMessageItem } from '../../lib/chatApi';

interface ChatMessageProps {
  message: ChatMessageItem;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 text-xs font-sans ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-lg bg-brass-500/10 border border-brass-500/30 flex items-center justify-center text-brass-400 shrink-0">
          <Bot className="w-4 h-4" />
        </div>
      )}

      <div
        className={`max-w-[85%] rounded-xl p-3 border space-y-1 ${
          isUser
            ? 'bg-brass-500/10 text-paper-100 border-brass-500/30 font-mono text-[11px]'
            : 'bg-ink-700 text-paper-100 border-ink-600 leading-relaxed'
        }`}
      >
        <div className="flex items-center justify-between text-[10px] text-paper-400 font-mono mb-1">
          <span>{isUser ? 'You' : 'TradeOps Copilot'}</span>
        </div>
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>

      {isUser && (
        <div className="w-7 h-7 rounded-lg bg-ink-700 border border-ink-600 flex items-center justify-center text-paper-400 shrink-0">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}
