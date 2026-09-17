import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useTradesRealtime } from '../hooks/useTradesRealtime';
import type { PullRun, Trade } from '../types';
import { ArrowLeft, CheckCircle, AlertTriangle, Clock, Layers, Database } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.PROD ? '' : 'http://localhost:4000');

export function RunDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { trades: allTrades } = useTradesRealtime();
  const [run, setRun] = useState<PullRun | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRunDetail() {
      if (!id) return;
      if (supabase) {
        const { data } = await supabase
          .from('pull_runs')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (data) setRun(data as PullRun);
      } else {
        try {
          const res = await fetch(`${API_BASE_URL}/api/pull/status`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.id === id) setRun(data);
          }
        } catch (err) {
          console.error(err);
        }
      }
      setLoading(false);
    }

    loadRunDetail();
  }, [id]);

  const runTrades = allTrades.filter(
    (t) => t.pull_run_id === id || (!t.pull_run_id && allTrades.indexOf(t) < 500)
  );

  const percent = run?.total_trades
    ? Math.min(100, Math.round((run.ingested_count / run.total_trades) * 100))
    : 0;

  return (
    <div className="space-y-6">
      {/* BACK BUTTON */}
      <Link
        to="/runs"
        className="inline-flex items-center gap-1.5 text-xs text-paper-400 hover:text-paper-100 font-mono transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Pull Runs</span>
      </Link>

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink-600 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl font-bold text-paper-100">Run Inspection</h1>
            <span className="font-mono text-sm text-brass-400 font-bold bg-brass-500/10 px-2 py-0.5 rounded border border-brass-500/20">
              {id}
            </span>
          </div>
          <p className="text-xs text-paper-400 mt-1">
            Detailed telemetry, progress metrics, and associated trade records.
          </p>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
        <div className="bg-ink-800 rounded-xl p-4 border border-ink-600 space-y-1">
          <span className="text-paper-400 text-[10px] uppercase">Execution Status</span>
          <div className="text-base font-bold text-paper-100 uppercase">{run?.status ?? 'Unknown'}</div>
        </div>

        <div className="bg-ink-800 rounded-xl p-4 border border-ink-600 space-y-1">
          <span className="text-paper-400 text-[10px] uppercase">Ingested Count</span>
          <div className="text-base font-bold text-teal-400">
            {run?.ingested_count.toLocaleString() ?? 0} / {run?.total_trades?.toLocaleString() ?? '—'}
          </div>
        </div>

        <div className="bg-ink-800 rounded-xl p-4 border border-ink-600 space-y-1">
          <span className="text-paper-400 text-[10px] uppercase">Chunk Size</span>
          <div className="text-base font-bold text-brass-400">
            {run?.chunk_size ?? 100} trades / batch
          </div>
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div className="bg-ink-800 rounded-xl p-4 border border-ink-600 space-y-2">
        <div className="flex justify-between text-xs font-mono">
          <span className="text-paper-400">Run Completion</span>
          <span className="text-brass-400 font-bold">{percent}%</span>
        </div>
        <div className="w-full bg-ink-950 h-3 rounded-full overflow-hidden border border-ink-600">
          <div
            className="h-full bg-gradient-to-r from-brass-500 to-teal-400 transition-all duration-300"
            style={{ width: `${percent}%` }}
          ></div>
        </div>
      </div>

      {/* RUN TRADES TABLE */}
      <div className="bg-ink-800 rounded-xl border border-ink-600 p-4 space-y-3">
        <h3 className="font-serif text-sm font-bold text-paper-100">
          Associated Trade Records ({runTrades.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-ink-600 text-paper-400 text-[11px]">
                <th className="py-2 px-3">Trade ID</th>
                <th className="py-2 px-3">Client</th>
                <th className="py-2 px-3">Symbol</th>
                <th className="py-2 px-3 text-right">Qty</th>
                <th className="py-2 px-3 text-right">Price</th>
                <th className="py-2 px-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-600/50 text-paper-100">
              {runTrades.map((t) => (
                <tr key={t.id || t.trade_id} className="hover:bg-ink-700/40">
                  <td className="py-2 px-3 text-brass-400">{t.trade_id}</td>
                  <td className="py-2 px-3 text-paper-400">{t.client}</td>
                  <td className="py-2 px-3 font-bold">{t.symbol}</td>
                  <td className="py-2 px-3 text-right">{t.quantity.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right">₹{t.price.toFixed(2)}</td>
                  <td className="py-2 px-3 text-right text-paper-400">
                    {new Date(t.trade_timestamp).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
