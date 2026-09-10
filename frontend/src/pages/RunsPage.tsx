import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { usePullStatus } from '../hooks/usePullStatus';
import type { PullRun } from '../types';
import { History, Play, CheckCircle, AlertTriangle, Clock, ArrowRight } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

export function RunsPage() {
  const { pullRun: currentRun } = usePullStatus();
  const [runs, setRuns] = useState<PullRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRuns() {
      if (supabase) {
        const { data, error } = await supabase
          .from('pull_runs')
          .select('*')
          .order('started_at', { ascending: false });

        if (!error && data) {
          setRuns(data as PullRun[]);
        }
      } else {
        try {
          const res = await fetch(`${API_BASE_URL}/api/pull/status`);
          if (res.ok) {
            const data = await res.json();
            if (data) setRuns([data]);
          }
        } catch (err) {
          console.error(err);
        }
      }
      setLoading(false);
    }

    loadRuns();
  }, [currentRun]);

  function getDuration(start: string, end: string | null) {
    if (!end) return 'In Progress...';
    const ms = new Date(end).getTime() - new Date(start).getTime();
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const remSecs = seconds % 60;
    return `${mins}m ${remSecs}s`;
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono bg-teal-400/10 text-teal-400 border border-teal-400/30">
            <CheckCircle className="w-3.5 h-3.5" />
            Completed
          </span>
        );
      case 'running':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono bg-brass-500/10 text-brass-400 border border-brass-500/30">
            <span className="w-2 h-2 rounded-full bg-brass-400 animate-ping"></span>
            Running
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono bg-clay-400/10 text-clay-400 border border-clay-400/30">
            <AlertTriangle className="w-3.5 h-3.5" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono bg-ink-700 text-paper-400 border border-ink-600">
            Idle
          </span>
        );
    }
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink-600 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-6 h-6 text-brass-400" />
            <h1 className="font-serif text-2xl font-bold text-paper-100">Pull Run History</h1>
          </div>
          <p className="text-xs text-paper-400 mt-1">
            Complete audit trail of chunked exchange ingestion jobs and status.
          </p>
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <div className="bg-ink-800 rounded-xl border border-ink-600 p-4 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-ink-600 text-[11px] font-mono text-paper-400 uppercase">
                <th className="py-3 px-4">Run Identifier</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Ingested / Total</th>
                <th className="py-3 px-4">Started At</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-600/60 font-mono text-xs text-paper-100">
              {runs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-paper-400">
                    No pull runs recorded yet. Start a pull from the header or Live Ops tab!
                  </td>
                </tr>
              ) : (
                runs.map((run) => (
                  <tr key={run.id} className="hover:bg-ink-700/50 transition-colors group">
                    <td className="py-3 px-4 font-bold text-brass-400">{run.id}</td>
                    <td className="py-3 px-4">{getStatusBadge(run.status)}</td>
                    <td className="py-3 px-4">
                      {run.ingested_count.toLocaleString()}{' '}
                      <span className="text-paper-400">
                        / {run.total_trades ? run.total_trades.toLocaleString() : '—'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-paper-400">
                      {new Date(run.started_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-paper-400">
                      {getDuration(run.started_at, run.completed_at)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/runs/${run.id}`}
                        className="inline-flex items-center gap-1 text-brass-400 hover:text-brass-300 font-sans font-medium hover:underline"
                      >
                        <span>Inspect</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
