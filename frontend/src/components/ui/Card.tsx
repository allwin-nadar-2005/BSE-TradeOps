import type { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-ink-800 border border-ink-600 rounded-sm ${className}`}>{children}</div>
  );
}
