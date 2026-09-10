import { Sparkles } from 'lucide-react';

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
}

export function SuggestedPrompts({ onSelect }: SuggestedPromptsProps) {
  const prompts = [
    'What is happening right now?',
    'Show me the latest ingestion status.',
    'Which symbols are most active?',
    'Explain the 30-second connection problem.',
  ];

  return (
    <div className="space-y-2 py-2">
      <div className="flex items-center gap-1.5 text-[10px] font-mono text-paper-400 uppercase tracking-wider">
        <Sparkles className="w-3 h-3 text-brass-400" />
        <span>Suggested Questions</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {prompts.map((p, i) => (
          <button
            key={i}
            onClick={() => onSelect(p)}
            className="text-[11px] font-sans text-paper-400 hover:text-paper-100 bg-ink-900 hover:bg-ink-700 border border-ink-600 hover:border-brass-500/40 px-2.5 py-1 rounded-lg transition-all text-left"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
