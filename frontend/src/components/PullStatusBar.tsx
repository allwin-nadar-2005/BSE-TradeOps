import { useEffect, useState } from 'react';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import type { PullRun } from '../types';

function useElapsed(startedAt: string | null, endedAt: string | null) {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!startedAt) return;
    const start = new Date(startedAt).getTime();

    if (endedAt) {
      setElapsedMs(new Date(endedAt).getTime() - start);
      return;
    }

    const tick = () => setElapsedMs(Date.now() - start);
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startedAt, endedAt]);

  return elapsedMs;
}

function formatElapsed(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

export function PullStatusBar({
  pullRun,
  onStart,
  starting,
}: {
  pullRun: PullRun | null;
  onStart: () => void;
  starting: boolean;
}) {
  const elapsedMs = useElapsed(pullRun?.started_at ?? null, pullRun?.completed_at ?? null);
  const isRunning = pullRun?.status === 'running';
  const total = pullRun?.total_trades ?? null;
  const ingested = pullRun?.ingested_count ?? 0;
  const pct = total ? Math.min(100, Math.round((ingested / total) * 100)) : 0;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border border-ink-600 bg-ink-800 rounded-sm px-4 py-3">
      <div className="flex items-center gap-3 min-w-0">
        {pullRun ? (
          <Badge tone={pullRun.status}>
            {pullRun.status === 'running' && 'Pulling'}
            {pullRun.status === 'completed' && 'Complete'}
            {pullRun.status === 'failed' && 'Failed'}
            {pullRun.status === 'idle' && 'Idle'}
          </Badge>
        ) : (
          <Badge tone="idle">No pull yet</Badge>
        )}

        <div className="font-mono text-sm text-paper-100 truncate">
          {pullRun && isRunning && (
            <span>
              {ingested.toLocaleString()} / {total ? total.toLocaleString() : '…'} trades
            </span>
          )}
          {pullRun && pullRun.status === 'completed' && (
            <span>
              {ingested.toLocaleString()} trades in {formatElapsed(elapsedMs)}
            </span>
          )}
          {pullRun && pullRun.status === 'failed' && (
            <span className="text-clay-400">{pullRun.error_message ?? 'Ingestion failed'}</span>
          )}
          {!pullRun && <span className="text-paper-400">Start a pull to begin ingesting trades.</span>}
        </div>

        {pullRun && isRunning && (
          <span className="hidden sm:inline text-xs text-paper-400 font-mono">
            {formatElapsed(elapsedMs)} elapsed
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {pullRun && isRunning && (
          <div className="w-40 h-1.5 bg-ink-700 rounded-sm overflow-hidden">
            <div
              className="h-full bg-brass-500 transition-[width] duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
        <Button onClick={onStart} disabled={isRunning || starting}>
          {isRunning ? 'Pulling…' : starting ? 'Starting…' : 'Start Pull'}
        </Button>
      </div>
    </div>
  );
}
