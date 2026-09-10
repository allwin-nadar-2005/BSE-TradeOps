import type { ReactNode } from 'react';

const TONES = {
  idle: 'text-paper-400 border-ink-600',
  running: 'text-brass-400 border-brass-600',
  completed: 'text-teal-400 border-teal-400/40',
  failed: 'text-clay-400 border-clay-400/40',
} as const;

export function Badge({ tone, children }: { tone: keyof typeof TONES; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 border rounded-sm px-2 py-0.5 text-xs font-medium ${TONES[tone]}`}>
      {tone === 'running' && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brass-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brass-400" />
        </span>
      )}
      {children}
    </span>
  );
}
