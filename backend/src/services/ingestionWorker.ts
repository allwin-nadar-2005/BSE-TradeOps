import { supabase } from './supabaseClient.js';
import type { GetTradesResponse, PullRunRow, PullStatus } from '../types.js';

const MOCK_BSE_BASE_URL = process.env.MOCK_BSE_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:4000');
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

import { getSeedDataset } from './mockData.js';

export async function getLatestPullRunRow(): Promise<PullRunRow | null> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('pull_runs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!error && data) return data as PullRunRow;
    } catch {
      // Fallback to in-memory store if Supabase fails
    }
  }
  const runs = Array.from(inMemoryPullRuns.values()).sort(
    (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
  );
  if (runs.length === 0) {
    const seedRun: PullRunRow = {
      id: 'run-seed-0000000',
      status: 'completed',
      total_trades: 4800,
      ingested_count: 300,
      current_offset: 300,
      chunk_size: 100,
      started_at: new Date(Date.now() - 3600000).toISOString(),
      completed_at: new Date(Date.now() - 3500000).toISOString(),
      error_message: null,
    };
    inMemoryPullRuns.set(seedRun.id, seedRun);
    return seedRun;
  }
  return runs[0] ?? null;
}

export async function getIngestedTrades(limit = 500) {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (!error && data && data.length > 0) return data;
    } catch {
      // Fallback to in-memory store if Supabase query fails
    }
  }
  if (inMemoryTrades.length === 0) {
    const seed = getSeedDataset();
    const now = new Date().toISOString();
    const mockPullId = 'run-seed-0000000';
    seed.slice(0, 300).forEach((t, idx) => {
      inMemoryTrades.push({
        id: `t-${t.trade_id}-${idx}`,
        trade_id: t.trade_id,
        pull_run_id: mockPullId,
        client: t.client,
        symbol: t.symbol,
        quantity: t.quantity,
        price: t.price,
        trade_timestamp: t.trade_timestamp,
        created_at: t.trade_timestamp || now,
      });
    });
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
    current_offset: 0,
    chunk_size: CHUNK_LIMIT,
    started_at: now,
    completed_at: null,
    error_message: null,
  };

  if (supabase) {
    const { data, error } = await supabase
      .from('pull_runs')
      .insert({ status: 'running', ingested_count: 0, current_offset: 0, chunk_size: CHUNK_LIMIT })
      .select()
      .single();

    if (!error && data) {
      initialRow.id = data.id as string;
    }
  }

  inMemoryPullRuns.set(initialRow.id, initialRow);
  activePullRunId = initialRow.id;
  broadcastEvent('pull_run_started', initialRow);

  return { id: initialRow.id, status: 'running' };
}

export async function stepPull(pullRunId: string): Promise<void> {
  let pullRun: PullRunRow | null = null;
  
  if (supabase) {
    const { data } = await supabase.from('pull_runs').select('*').eq('id', pullRunId).maybeSingle();
    if (data) pullRun = data as PullRunRow;
  }
  
  if (!pullRun) pullRun = inMemoryPullRuns.get(pullRunId) ?? null;
  if (!pullRun) throw new Error('Pull run not found');
  if (pullRun.status !== 'running') return;

  const offset = pullRun.current_offset ?? 0;
  let ingested = pullRun.ingested_count ?? 0;

  try {
    const chunk = await fetchChunkWithRetry(offset);
    let total = pullRun.total_trades;

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
          throw new Error(`Supabase insert error at offset ${offset}: ${insertError.message}`);
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
    }

    if (!chunk.hasMore || chunk.nextOffset === null) {
      await updatePullRun(pullRunId, {
        ingested_count: ingested,
        status: 'completed',
        completed_at: new Date().toISOString(),
      });
      activePullRunId = null;
    } else {
      await updatePullRun(pullRunId, {
        ingested_count: ingested,
        current_offset: chunk.nextOffset
      });
    }
  } catch (err) {
    console.error('Ingestion chunk failed:', err);
    await updatePullRun(pullRunId, {
      status: 'failed',
      error_message: err instanceof Error ? err.message : String(err),
      completed_at: new Date().toISOString(),
    }).catch(() => {});
    activePullRunId = null;
    throw err;
  }
}
