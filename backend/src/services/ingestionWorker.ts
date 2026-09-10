import { supabase } from './supabaseClient.js';
import type { GetTradesResponse, PullRunRow, PullStatus } from '../types.js';

const MOCK_BSE_BASE_URL = process.env.MOCK_BSE_BASE_URL ?? 'http://localhost:4000';
const CHUNK_LIMIT = Number(process.env.CHUNK_LIMIT ?? 100);
const MAX_RETRIES_PER_CHUNK = 2;

let activePullRunId: string | null = null;

// In-memory state for fallback when Supabase is not configured (or alongside Supabase)
const inMemoryPullRuns = new Map<string, PullRunRow>();
const inMemoryTrades: Array<{
  id: string;
  trade_id: string;
  pull_run_id: string;
  client: string;
  symbol: string;
  quantity: number;
  price: number;
  trade_timestamp: string;
  created_at: string;
}> = [];

type EventListener = (event: { type: string; data: unknown }) => void;
const eventListeners = new Set<EventListener>();

export function subscribeToEvents(listener: EventListener): () => void {
  eventListeners.add(listener);
  return () => eventListeners.delete(listener);
}

function broadcastEvent(type: string, data: unknown) {
  eventListeners.forEach((fn) => {
    try {
      fn({ type, data });
    } catch (err) {
      console.error('Error in event listener:', err);
    }
  });
}

export function isPullActive() {
  return activePullRunId !== null;
}

export async function getLatestPullRunRow(): Promise<PullRunRow | null> {
  if (supabase) {
    const { data, error } = await supabase
      .from('pull_runs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!error && data) return data as PullRunRow;
  }
  const runs = Array.from(inMemoryPullRuns.values()).sort(
    (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
  );
  return runs[0] ?? null;
}

export async function getIngestedTrades(limit = 500) {
  if (supabase) {
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (!error && data) return data;
  }
  return inMemoryTrades.slice(0, limit);
}

async function updatePullRun(id: string, patch: Partial<PullRunRow>) {
  if (supabase) {
    const { error } = await supabase.from('pull_runs').update(patch).eq('id', id);
    if (error) console.error(`Failed updating Supabase pull_runs: ${error.message}`);
  }

  const existing = inMemoryPullRuns.get(id);
  if (existing) {
    const updated = { ...existing, ...patch };
    inMemoryPullRuns.set(id, updated);
    broadcastEvent('pull_run_updated', updated);
  }
}

async function fetchChunk(offset: number, delayMs?: number): Promise<GetTradesResponse> {
  const url = new URL('/getTrades', MOCK_BSE_BASE_URL);
  url.searchParams.set('offset', String(offset));
  url.searchParams.set('limit', String(CHUNK_LIMIT));
  if (delayMs !== undefined) url.searchParams.set('delayMs', String(delayMs));

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Mock BSE API returned ${res.status}`);
  }
  return (await res.json()) as GetTradesResponse;
}

async function fetchChunkWithRetry(offset: number): Promise<GetTradesResponse> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES_PER_CHUNK; attempt++) {
    try {
      return await fetchChunk(offset);
    } catch (err) {
      lastError = err;
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Unknown chunk error');
}

export async function startPull(): Promise<{ id: string; status: PullStatus }> {
  if (activePullRunId) {
    throw new Error('A pull is already running');
  }

  const newId = `run-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const initialRow: PullRunRow = {
    id: newId,
    status: 'running',
    total_trades: null,
    ingested_count: 0,
    chunk_size: CHUNK_LIMIT,
    started_at: now,
    completed_at: null,
    error_message: null,
  };

  if (supabase) {
    const { data, error } = await supabase
      .from('pull_runs')
      .insert({ status: 'running', ingested_count: 0, chunk_size: CHUNK_LIMIT })
      .select()
      .single();

    if (!error && data) {
      initialRow.id = data.id as string;
    }
  }

  inMemoryPullRuns.set(initialRow.id, initialRow);
  activePullRunId = initialRow.id;
  broadcastEvent('pull_run_started', initialRow);

  runIngestionLoop(initialRow.id).catch(async (err) => {
    console.error('Ingestion loop crashed:', err);
    await updatePullRun(initialRow.id, {
      status: 'failed',
      error_message: err instanceof Error ? err.message : String(err),
      completed_at: new Date().toISOString(),
    }).catch(() => {});
    activePullRunId = null;
  });

  return { id: initialRow.id, status: 'running' };
}

async function runIngestionLoop(pullRunId: string) {
  let offset = 0;
  let ingested = 0;
  let total: number | null = null;

  while (true) {
    const chunk = await fetchChunkWithRetry(offset);

    if (total === null) {
      total = chunk.total;
      await updatePullRun(pullRunId, { total_trades: total });
    }

    if (chunk.trades.length > 0) {
      const now = new Date().toISOString();
      const rows = chunk.trades.map((t, idx) => ({
        id: `t-${t.trade_id}-${idx}`,
        trade_id: t.trade_id,
        pull_run_id: pullRunId,
        client: t.client,
        symbol: t.symbol,
        quantity: t.quantity,
        price: t.price,
        trade_timestamp: t.trade_timestamp,
        created_at: now,
      }));

      if (supabase) {
        const { error: insertError } = await supabase
          .from('trades')
          .upsert(
            rows.map(({ id: _id, created_at: _ca, ...rest }) => rest),
            { onConflict: 'trade_id', ignoreDuplicates: true }
          );

        if (insertError) {
          console.error(`Supabase insert error at offset ${offset}: ${insertError.message}`);
        }
      }

      // Add to in-memory store
      rows.forEach((r) => {
        if (!inMemoryTrades.some((existing) => existing.trade_id === r.trade_id)) {
          inMemoryTrades.unshift(r);
          broadcastEvent('trade_inserted', r);
        }
      });

      ingested += chunk.trades.length;
      await updatePullRun(pullRunId, { ingested_count: ingested });
    }

    if (!chunk.hasMore || chunk.nextOffset === null) break;
    offset = chunk.nextOffset;
  }

  await updatePullRun(pullRunId, {
    status: 'completed',
    completed_at: new Date().toISOString(),
  });
  activePullRunId = null;
}
