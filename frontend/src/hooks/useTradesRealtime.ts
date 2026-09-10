import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Trade } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';
const INITIAL_LOAD_LIMIT = 500;

export function useTradesRealtime() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [newestIds, setNewestIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const seenIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    function handleIncomingTrade(row: Trade) {
      if (seenIds.current.has(row.id || row.trade_id)) return;
      const id = row.id || row.trade_id;
      seenIds.current.add(id);

      setTrades((prev) => [row, ...prev].slice(0, 2000));
      setNewestIds((prev) => new Set(prev).add(id));

      setTimeout(() => {
        setNewestIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, 1600);
    }

    const client = supabase;
    if (client) {
      // 1. Supabase Mode
      async function loadInitialSupabase() {
        const { data, error } = await client!
          .from('trades')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(INITIAL_LOAD_LIMIT);

        if (cancelled) return;
        if (error) {
          console.error('Failed to load initial trades from Supabase:', error.message);
          setLoading(false);
          return;
        }

        const rows = (data ?? []) as Trade[];
        rows.forEach((r) => seenIds.current.add(r.id || r.trade_id));
        setTrades(rows);
        setLoading(false);
      }

      loadInitialSupabase();

      // Use a unique channel topic name per hook instance to prevent collision errors
      const channelId = `trades-inserts-${Math.random().toString(36).substring(2, 9)}`;
      const channel = client
        .channel(channelId)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'trades' },
          (payload) => {
            handleIncomingTrade(payload.new as Trade);
          }
        )
        .subscribe();

      return () => {
        cancelled = true;
        client.removeChannel(channel);
      };
    } else {
      // 2. Local REST + SSE Fallback Mode
      async function loadInitialLocal() {
        try {
          const res = await fetch(`${API_BASE_URL}/api/trades?limit=${INITIAL_LOAD_LIMIT}`);
          if (res.ok) {
            const data = (await res.json()) as Trade[];
            if (!cancelled) {
              data.forEach((r) => seenIds.current.add(r.id || r.trade_id));
              setTrades(data);
            }
          }
        } catch (err) {
          console.error('Failed to load trades from local API:', err);
        } finally {
          if (!cancelled) setLoading(false);
        }
      }

      loadInitialLocal();

      // SSE connection
      let eventSource: EventSource | null = null;
      try {
        eventSource = new EventSource(`${API_BASE_URL}/api/events`);
        eventSource.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);
            if (parsed.type === 'trade_inserted') {
              handleIncomingTrade(parsed.data as Trade);
            }
          } catch (e) {
            console.error('Error parsing SSE event:', e);
          }
        };
      } catch (err) {
        console.error('SSE initialization error:', err);
      }

      // Polling fallback in case SSE is interrupted
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/trades?limit=100`);
          if (res.ok) {
            const data = (await res.json()) as Trade[];
            data.reverse().forEach((r) => handleIncomingTrade(r));
          }
        } catch {
          // ignore polling errors
        }
      }, 2000);

      return () => {
        cancelled = true;
        clearInterval(interval);
        if (eventSource) eventSource.close();
      };
    }
  }, []);

  return { trades, newestIds, loading };
}
