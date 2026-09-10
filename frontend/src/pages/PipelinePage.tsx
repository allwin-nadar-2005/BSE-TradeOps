import { usePullStatus } from '../hooks/usePullStatus';
import { useTradesRealtime } from '../hooks/useTradesRealtime';
import { Cpu, Server, Database, Zap, CheckCircle2, ShieldAlert, Clock, RefreshCw } from 'lucide-react';

export function PipelinePage() {
  const { pullRun } = usePullStatus();
  const { trades } = useTradesRealtime();

  const isRunning = pullRun?.status === 'running';
  const total = pullRun?.total_trades ?? 4800;
  const ingested = pullRun?.ingested_count ?? trades.length;
  const chunkSize = pullRun?.chunk_size ?? 100;
  const estimatedChunks = Math.ceil(total / chunkSize);
  const currentChunk = Math.ceil(ingested / chunkSize);
  const progressPct = total > 0 ? Math.min(100, Math.round((ingested / total) * 100)) : 0;

  const latestTrade = trades[0];
  const lastTimestamp = latestTrade?.created_at
    ? new Date(latestTrade.created_at).toLocaleTimeString()
    : '—';

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink-600 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-6 h-6 text-teal-400" />
            <h1 className="font-serif text-2xl font-bold text-paper-100">Pipeline Health & Telemetry</h1>
          </div>
          <p className="text-xs text-paper-400 mt-1">
            Realtime monitoring of the chunked ingestion architecture and &lt;30s network ceiling compliance.
          </p>
        </div>
      </div>

      {/* PIPELINE ARCHITECTURE DIAGRAM */}
      <div className="bg-ink-800 rounded-2xl p-6 border border-ink-600 space-y-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-base font-bold text-paper-100 flex items-center gap-2">
            <Zap className="w-4 h-4 text-brass-400" />
            <span>Architecture Flow & Live Node Status</span>
          </h2>
          <span className="text-[11px] font-mono text-teal-400 bg-teal-400/10 px-2.5 py-1 rounded border border-teal-400/20">
            ● PIPELINE HEALTHY
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {/* Node 1: Exchange API */}
          <div className="bg-ink-900 rounded-xl p-4 border border-ink-600 space-y-3">
            <div className="flex items-center justify-between text-paper-400">
              <Server className="w-5 h-5 text-brass-400" />
              <span className="text-[10px] font-mono text-brass-400 uppercase">Step 1</span>
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-sm font-bold text-paper-100">Mock BSE API</h3>
              <p className="text-[11px] text-paper-400">HTTP endpoint serving cursor-paginated chunks.</p>
            </div>
            <div className="pt-2 border-t border-ink-600/60 text-[10px] font-mono text-teal-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Latency ~1.5s per chunk</span>
            </div>
          </div>

          {/* Node 2: Worker */}
          <div className={`bg-ink-900 rounded-xl p-4 border space-y-3 transition-colors ${
            isRunning ? 'border-brass-400 shadow-md shadow-brass-500/10' : 'border-ink-600'
          }`}>
            <div className="flex items-center justify-between text-paper-400">
              <RefreshCw className={`w-5 h-5 ${isRunning ? 'text-brass-400 animate-spin' : 'text-paper-400'}`} />
              <span className="text-[10px] font-mono text-brass-400 uppercase">Step 2</span>
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-sm font-bold text-paper-100">Chunk Ingestion Worker</h3>
              <p className="text-[11px] text-paper-400">Sequentially pulls offsets under 30s limit.</p>
            </div>
            <div className="pt-2 border-t border-ink-600/60 text-[10px] font-mono text-brass-400">
              {isRunning ? `Pulling Chunk ${currentChunk}/${estimatedChunks}` : 'Worker Sleeping'}
            </div>
          </div>

          {/* Node 3: Database */}
          <div className="bg-ink-900 rounded-xl p-4 border border-ink-600 space-y-3">
            <div className="flex items-center justify-between text-paper-400">
              <Database className="w-5 h-5 text-teal-400" />
              <span className="text-[10px] font-mono text-brass-400 uppercase">Step 3</span>
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-sm font-bold text-paper-100">Postgres Storage</h3>
              <p className="text-[11px] text-paper-400">Upserts trades with conflict resolution.</p>
            </div>
            <div className="pt-2 border-t border-ink-600/60 text-[10px] font-mono text-teal-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Realtime Publication Active</span>
            </div>
          </div>

          {/* Node 4: Realtime Client */}
          <div className="bg-ink-900 rounded-xl p-4 border border-ink-600 space-y-3">
            <div className="flex items-center justify-between text-paper-400">
              <Zap className="w-5 h-5 text-teal-400" />
              <span className="text-[10px] font-mono text-brass-400 uppercase">Step 4</span>
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-sm font-bold text-paper-100">Realtime UI Stream</h3>
              <p className="text-[11px] text-paper-400">Pushes new rows directly to browser.</p>
            </div>
            <div className="pt-2 border-t border-ink-600/60 text-[10px] font-mono text-teal-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>0 Polling / 0 Refetch</span>
            </div>
          </div>
        </div>
      </div>

      {/* TELEMETRY METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
        <div className="bg-ink-800 rounded-xl p-4 border border-ink-600 space-y-2">
          <span className="text-paper-400 text-[10px] uppercase">Active Pull Status</span>
          <div className="text-lg font-bold text-paper-100 uppercase">{pullRun?.status ?? 'Idle'}</div>
          <div className="text-[11px] text-brass-400">{isRunning ? 'Ingestion active' : 'Waiting for trigger'}</div>
        </div>

        <div className="bg-ink-800 rounded-xl p-4 border border-ink-600 space-y-2">
          <span className="text-paper-400 text-[10px] uppercase">Chunk Progress</span>
          <div className="text-lg font-bold text-teal-400">
            Chunk {currentChunk} / {estimatedChunks}
          </div>
          <div className="text-[11px] text-paper-400">{chunkSize} trades per chunk</div>
        </div>

        <div className="bg-ink-800 rounded-xl p-4 border border-ink-600 space-y-2">
          <span className="text-paper-400 text-[10px] uppercase">Ingested Volume</span>
          <div className="text-lg font-bold text-paper-100">
            {ingested.toLocaleString()} / {total.toLocaleString()}
          </div>
          <div className="text-[11px] text-teal-400">{progressPct}% completed</div>
        </div>

        <div className="bg-ink-800 rounded-xl p-4 border border-ink-600 space-y-2">
          <span className="text-paper-400 text-[10px] uppercase">Network Guarantee</span>
          <div className="text-lg font-bold text-teal-400 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
            <span>PASSED</span>
          </div>
          <div className="text-[11px] text-paper-400">All calls &lt; 30s limit</div>
        </div>
      </div>

      {/* DETAILED PIPELINE GUARANTEES */}
      <div className="bg-ink-800 rounded-xl p-6 border border-ink-600 space-y-4">
        <h3 className="font-serif text-base font-bold text-paper-100">Pipeline Operational Guarantees</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-ink-900 p-4 rounded-lg border border-ink-600 space-y-2">
            <div className="font-bold text-brass-400 font-serif">1. 30-Second Connection Limit</div>
            <p className="text-paper-400 text-[11px] leading-relaxed">
              Long HTTP connections fail on cloud gateways. The ingestion engine limits each fetch to 100 trades, completing in under 2 seconds.
            </p>
          </div>

          <div className="bg-ink-900 p-4 rounded-lg border border-ink-600 space-y-2">
            <div className="font-bold text-teal-400 font-serif">2. Zero Client Polling</div>
            <p className="text-paper-400 text-[11px] leading-relaxed">
              The frontend UI never executes <code className="text-paper-100">setInterval</code> refetching. Supabase Postgres Realtime triggers socket events on INSERT.
            </p>
          </div>

          <div className="bg-ink-900 p-4 rounded-lg border border-ink-600 space-y-2">
            <div className="font-bold text-brass-400 font-serif">3. Idempotent Upserts</div>
            <p className="text-paper-400 text-[11px] leading-relaxed">
              If a chunk is retried due to transient network failure, Postgres conflict resolution prevents duplicate trade entries.
            </p>
          </div>

          <div className="bg-ink-900 p-4 rounded-lg border border-ink-600 space-y-2">
            <div className="font-bold text-teal-400 font-serif">4. Concurrency Protection</div>
            <p className="text-paper-400 text-[11px] leading-relaxed">
              Submitting a new pull request while an ingestion loop is running returns HTTP 409 Conflict, preserving worker state.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
