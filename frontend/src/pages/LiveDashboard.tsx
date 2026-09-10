import { useMemo, useState } from 'react';
import { PullStatusBar } from '../components/PullStatusBar';
import { TradesTable } from '../components/TradesTable';
import { StatCard } from '../components/StatCard';
import { useTradesRealtime } from '../hooks/useTradesRealtime';
import { usePullStatus } from '../hooks/usePullStatus';
import { startPull } from '../lib/api';
import { Activity, Clock, Zap, AlertCircle } from 'lucide-react';

export function LiveDashboard() {
  const { trades, newestIds, loading: loadingTrades } = useTradesRealtime();
  const { pullRun, loading: loadingStatus } = usePullStatus();
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  async function handleStart() {
    setStartError(null);
    setStarting(true);
    try {
      await startPull();
    } catch (err) {
      setStartError(err instanceof Error ? err.message : 'Failed to start pull');
    } finally {
      setStarting(false);
    }
  }

  const snapshot = useMemo(() => {
    if (trades.length === 0) {
      return { topSymbol: '—', tradesPerMinute: 0, lastTradeTime: '—' };
    }

    const volumeBySymbol = new Map<string, number>();
    trades.forEach((t) => {
      volumeBySymbol.set(t.symbol, (volumeBySymbol.get(t.symbol) ?? 0) + t.quantity);
    });
    const topSymbol = [...volumeBySymbol.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

    const oldest = trades[trades.length - 1];
    const newest = trades[0];
    const spanMinutes = Math.max(
      1 / 60,
      (new Date(newest.created_at).getTime() - new Date(oldest.created_at).getTime()) / 60000
    );
    const tradesPerMinute = Math.round(trades.length / spanMinutes);

    const lastTradeTime = newest?.created_at
      ? new Date(newest.created_at).toLocaleTimeString()
      : '—';

    return { topSymbol, tradesPerMinute, lastTradeTime };
  }, [trades]);

  return (
    <div className="space-y-6">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink-600 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl font-bold text-paper-100">Live Operations Terminal</h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-teal-400/10 text-teal-400 border border-teal-400/30">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
              REALTIME PUSH
            </span>
          </div>
          <p className="text-xs text-paper-400 mt-1">
            Chunked ingestion running below 30s network ceiling — zero client polling.
          </p>
        </div>

        {/* Live Feed Status Pill */}
        <div className="flex items-center gap-3 bg-ink-800 px-3.5 py-2 rounded-lg border border-ink-600 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-paper-400">
            <Clock className="w-3.5 h-3.5 text-brass-400" />
            <span>Last Trade:</span>
            <span className="text-paper-100 font-bold">{snapshot.lastTradeTime}</span>
          </div>
          <span className="text-ink-600">|</span>
          <div className="flex items-center gap-1.5 text-paper-400">
            <Zap className="w-3.5 h-3.5 text-teal-400" />
            <span>Rate:</span>
            <span className="text-teal-400 font-bold">{snapshot.tradesPerMinute.toLocaleString()} t/m</span>
          </div>
        </div>
      </div>

      {/* PULL STATUS BAR */}
      <PullStatusBar pullRun={pullRun} onStart={handleStart} starting={starting} />

      {startError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-clay-400/10 border border-clay-400/30 text-clay-400 text-xs font-mono">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{startError}</span>
        </div>
      )}

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        {/* TRADES TABLE */}
        <div className="bg-ink-800 rounded-xl border border-ink-600 p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-brass-400" />
              <h2 className="font-serif text-sm font-bold text-paper-100">Live Ingested Trades</h2>
            </div>
            <span className="text-[11px] font-mono text-paper-400">
              Showing newest {trades.length} trades
            </span>
          </div>

          <TradesTable trades={trades} newestIds={newestIds} />
        </div>

        {/* SIDEBAR SNAPSHOT STATS */}
        <div className="flex flex-col gap-4">
          <h2 className="font-serif text-base text-paper-100 font-bold">Terminal Telemetry</h2>
          <StatCard label="Total Ingested" value={trades.length.toLocaleString()} />
          <StatCard
            label="Trades / Min Rate"
            value={snapshot.tradesPerMinute.toLocaleString()}
            sub="live flow speed"
          />
          <StatCard label="Top Volume Symbol" value={snapshot.topSymbol} />

          {/* SYSTEM ARCHITECTURE GUARANTEE */}
          <div className="bg-ink-800/80 rounded-xl p-4 border border-ink-600 text-xs space-y-2">
            <div className="text-brass-400 font-bold font-serif">Architecture Guarantee</div>
            <p className="text-[11px] text-paper-400 leading-relaxed">
              Calls to <code className="text-paper-100">/getTrades</code> are chunked in sequential batches of 100 trades. No request holds open longer than 30s.
            </p>
            <div className="pt-2 border-t border-ink-600 text-[10px] font-mono text-teal-400 flex items-center justify-between">
              <span>Client Polling: OFF</span>
              <span>Postgres Realtime: ON</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
