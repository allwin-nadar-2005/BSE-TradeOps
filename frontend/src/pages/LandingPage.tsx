import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  History,
  Layers,
  Play,
  RefreshCw,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useTradesRealtime } from '../hooks/useTradesRealtime';
import { usePullStatus } from '../hooks/usePullStatus';
import { startPull } from '../lib/api';
import { useState } from 'react';

export function LandingPage() {
  const { trades } = useTradesRealtime();
  const { pullRun } = usePullStatus();
  const [starting, setStarting] = useState(false);

  const isPulling = pullRun?.status === 'running';

  async function handleStart() {
    if (isPulling || starting) return;
    setStarting(true);
    try {
      await startPull();
    } catch (err) {
      console.error(err);
    } finally {
      setStarting(false);
    }
  }

  const features = [
    {
      icon: Clock,
      title: 'Short-Lived Connections',
      description:
        'Every exchange request completes under the 30-second network ceiling. No held-open connections, no connection dropouts.',
      highlight: '<30s Ceiling Enforced',
    },
    {
      icon: RefreshCw,
      title: 'Continuous Chunked Ingestion',
      description:
        'Sequentially ingests cursor-paginated chunks from the exchange feed in the background until thousands of trades land cleanly.',
      highlight: 'Chunk Offset Pagination',
    },
    {
      icon: Zap,
      title: 'Realtime Push Architecture',
      description:
        'Zero client polling and zero refetch loops. Supabase Postgres Realtime pushes trade inserts directly to connected clients.',
      highlight: 'Zero Polling',
    },
    {
      icon: ShieldCheck,
      title: 'Resilient Retry Engine',
      description:
        'Transient exchange errors trigger automated per-chunk retries with exponential backoff without losing pull state.',
      highlight: 'Self-Healing Engine',
    },
  ];

  return (
    <div className="space-y-16 py-4">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-ink-800 to-ink-950 border border-ink-600 p-8 sm:p-12 shadow-2xl">
        {/* Glow ambient background */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-brass-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brass-500/10 border border-brass-500/30 text-brass-400 text-xs font-mono font-medium">
            <Zap className="w-3.5 h-3.5" />
            <span>Exchange Ingestion Platform Phase 2</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-paper-100 tracking-tight leading-tight">
            Trade data moves fast.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brass-400 via-paper-100 to-teal-400">
              Your pipeline should too.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-paper-400 leading-relaxed font-sans">
            Reliably ingest large exchange datasets through short-lived connections and watch trades stream into your operations dashboard in real time.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              to="/live"
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-brass-500 hover:bg-brass-400 text-ink-950 font-bold text-sm shadow-lg shadow-brass-500/25 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Activity className="w-4 h-4" />
              <span>Launch Live Dashboard</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>

            <button
              onClick={handleStart}
              disabled={isPulling || starting}
              className={`flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-mono font-medium border transition-all ${
                isPulling
                  ? 'bg-ink-700 text-paper-400 border-ink-600 cursor-not-allowed'
                  : 'bg-ink-800 hover:bg-ink-700 text-paper-100 border-brass-500/40 hover:border-brass-400'
              }`}
            >
              <Play className="w-4 h-4 text-brass-400 fill-current" />
              <span>{isPulling ? 'Pull Currently Active' : starting ? 'Starting...' : 'Trigger Immediate Pull'}</span>
            </button>

            <Link
              to="/pipeline"
              className="flex items-center gap-2 px-5 py-3 rounded-lg bg-ink-800/80 hover:bg-ink-700 text-paper-400 hover:text-paper-100 text-sm border border-ink-600 transition-colors"
            >
              <Cpu className="w-4 h-4 text-teal-400" />
              <span>View Architecture</span>
            </Link>
          </div>

          {/* Quick Metrics Bar */}
          <div className="pt-6 border-t border-ink-600/60 grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
            <div>
              <div className="text-paper-400 text-[10px] uppercase">Connection Ceiling</div>
              <div className="text-brass-400 font-bold text-base">&lt; 30s Max</div>
            </div>
            <div>
              <div className="text-paper-400 text-[10px] uppercase">Ingestion Strategy</div>
              <div className="text-paper-100 font-bold text-base">Chunked Cursor</div>
            </div>
            <div>
              <div className="text-paper-400 text-[10px] uppercase">Realtime Delivery</div>
              <div className="text-teal-400 font-bold text-base">0ms Polling</div>
            </div>
            <div>
              <div className="text-paper-400 text-[10px] uppercase">Trades Ingested</div>
              <div className="text-paper-100 font-bold text-base">{trades.length.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ARCHITECTURE FLOW SECTION */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-paper-100">
            Engineered for Hard Network Constraints
          </h2>
          <p className="text-sm text-paper-400">
            How BSE TradeOps streams 15-minute exchange datasets without holding long connections or polling clients.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {/* Step 1 */}
          <div className="bg-ink-800 rounded-xl p-5 border border-ink-600 space-y-3 relative group hover:border-brass-500/40 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-ink-700 flex items-center justify-center text-brass-400 font-mono font-bold text-sm">
              01
            </div>
            <h3 className="font-serif text-base font-bold text-paper-100">Mock BSE Exchange</h3>
            <p className="text-xs text-paper-400 leading-relaxed">
              Exposes cursor-paginated <code className="text-brass-400">/getTrades</code> chunks with deliberate exchange latency simulation.
            </p>
            <div className="text-[10px] font-mono text-teal-400 bg-teal-400/10 px-2 py-1 rounded w-fit border border-teal-400/20">
              Chunked Feed
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-ink-800 rounded-xl p-5 border border-ink-600 space-y-3 relative group hover:border-brass-500/40 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-ink-700 flex items-center justify-center text-brass-400 font-mono font-bold text-sm">
              02
            </div>
            <h3 className="font-serif text-base font-bold text-paper-100">Ingestion Worker</h3>
            <p className="text-xs text-paper-400 leading-relaxed">
              Executes fast sequential HTTP fetches, checking off limits and retrying failures under 30s.
            </p>
            <div className="text-[10px] font-mono text-brass-400 bg-brass-500/10 px-2 py-1 rounded w-fit border border-brass-500/20">
              Background Loop
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-ink-800 rounded-xl p-5 border border-ink-600 space-y-3 relative group hover:border-brass-500/40 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-ink-700 flex items-center justify-center text-brass-400 font-mono font-bold text-sm">
              03
            </div>
            <h3 className="font-serif text-base font-bold text-paper-100">Database & Realtime</h3>
            <p className="text-xs text-paper-400 leading-relaxed">
              Upserts incoming trade rows into Postgres and triggers instant Realtime event publications.
            </p>
            <div className="text-[10px] font-mono text-teal-400 bg-teal-400/10 px-2 py-1 rounded w-fit border border-teal-400/20">
              Postgres Write
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-ink-800 rounded-xl p-5 border border-ink-600 space-y-3 relative group hover:border-brass-500/40 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-ink-700 flex items-center justify-center text-brass-400 font-mono font-bold text-sm">
              04
            </div>
            <h3 className="font-serif text-base font-bold text-paper-100">Operations Terminal</h3>
            <p className="text-xs text-paper-400 leading-relaxed">
              Subscribes directly to postgres changes. Rows render instantly with gold row-in animations.
            </p>
            <div className="text-[10px] font-mono text-paper-100 bg-ink-700 px-2 py-1 rounded w-fit border border-ink-600">
              Live Stream
            </div>
          </div>
        </div>
      </section>

      {/* KEY BENEFITS GRID */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-paper-100">
            Platform Core Capabilities
          </h2>
          <p className="text-sm text-paper-400">
            Built for institutional-grade reliability without sacrificing real-time visibility.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="bg-ink-800/80 rounded-xl p-6 border border-ink-600 flex flex-col justify-between space-y-4 hover:bg-ink-800 hover:border-brass-500/30 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-brass-500/10 border border-brass-500/20 flex items-center justify-center text-brass-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono uppercase bg-ink-700 text-brass-400 px-2 py-0.5 rounded border border-ink-600">
                      {f.highlight}
                    </span>
                  </div>
                  <h3 className="font-serif text-lg font-bold text-paper-100">{f.title}</h3>
                  <p className="text-xs text-paper-400 leading-relaxed">{f.description}</p>
                </div>
                <div className="pt-2 border-t border-ink-600/40 flex items-center gap-1.5 text-xs text-teal-400 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Enforced by backend ingestion engine</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* QUICK ACCESS MODULES */}
      <section className="bg-ink-800/50 rounded-2xl p-8 border border-ink-600 space-y-6">
        <h2 className="font-serif text-xl font-bold text-paper-100 text-center">
          Operations Modules
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/live"
            className="p-5 rounded-xl bg-ink-900 border border-ink-600 hover:border-brass-500/40 transition-all group space-y-2"
          >
            <div className="flex items-center justify-between">
              <Activity className="w-5 h-5 text-brass-400" />
              <ArrowRight className="w-4 h-4 text-paper-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <h4 className="font-serif text-sm font-bold text-paper-100">Live Dashboard</h4>
            <p className="text-[11px] text-paper-400">Monitor active chunked ingestion and trade stream.</p>
          </Link>

          <Link
            to="/analytics"
            className="p-5 rounded-xl bg-ink-900 border border-ink-600 hover:border-brass-500/40 transition-all group space-y-2"
          >
            <div className="flex items-center justify-between">
              <BarChart3 className="w-5 h-5 text-teal-400" />
              <ArrowRight className="w-4 h-4 text-paper-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <h4 className="font-serif text-sm font-bold text-paper-100">Trade Analytics</h4>
            <p className="text-[11px] text-paper-400">Volume breakdown, top clients, and arrival curves.</p>
          </Link>

          <Link
            to="/runs"
            className="p-5 rounded-xl bg-ink-900 border border-ink-600 hover:border-brass-500/40 transition-all group space-y-2"
          >
            <div className="flex items-center justify-between">
              <History className="w-5 h-5 text-brass-400" />
              <ArrowRight className="w-4 h-4 text-paper-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <h4 className="font-serif text-sm font-bold text-paper-100">Pull Run History</h4>
            <p className="text-[11px] text-paper-400">Audit completed, active, and failed ingestion runs.</p>
          </Link>

          <Link
            to="/pipeline"
            className="p-5 rounded-xl bg-ink-900 border border-ink-600 hover:border-brass-500/40 transition-all group space-y-2"
          >
            <div className="flex items-center justify-between">
              <Cpu className="w-5 h-5 text-teal-400" />
              <ArrowRight className="w-4 h-4 text-paper-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <h4 className="font-serif text-sm font-bold text-paper-100">Pipeline Health</h4>
            <p className="text-[11px] text-paper-400">Inspect system telemetry and latency guarantees.</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
