import type { ReactNode } from 'react';
import { Card } from './ui/Card';

export function StatCard({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <Card className="px-4 py-3">
      <div className="text-xs text-paper-400">{label}</div>
      <div className="font-mono text-xl text-paper-100 mt-1">{value}</div>
      {sub && <div className="text-xs text-paper-400 mt-0.5">{sub}</div>}
    </Card>
  );
}
