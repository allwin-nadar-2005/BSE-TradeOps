import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { PullRun } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.PROD ? '' : 'http://localhost:4000');

export function usePullStatus() {
  const [pullRun, setPullRun] = useState<PullRun | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const client = supabase;

    async function loadLatestLocal() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/pull/status`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setPullRun(data ?? null);
        }
      } catch (err) {
        console.error('Failed to fetch pull status from local API:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (client) {
      // 1. Supabase Realtime Mode with Local Fallback
      async function loadLatestSupabase() {
        try {
          const { data, error } = await client!
            .from('pull_runs')
            .select('*')
            .order('started_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (cancelled) return;
          if (error || !data) {
            if (error) console.error('Failed to load pull status from Supabase:', error.message);
            await loadLatestLocal();
          } else {
            setPullRun((data as PullRun) ?? null);
          }
          setLoading(false);
        } catch {
          await loadLatestLocal();
        }
      }

      loadLatestSupabase();

      // Use a unique channel topic name per hook instance to prevent collision errors
      const channelId = `pull-runs-changes-${Math.random().toString(36).substring(2, 9)}`;
      const channel = client
        .channel(channelId)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'pull_runs' },
          (payload) => {
            const row = (payload.new ?? payload.old) as PullRun;
            setPullRun((prev) => {
              if (!prev || row.id === prev.id || row.started_at >= prev.started_at) {
                return row;
              }
              return prev;
            });
          }
        )
        .subscribe();

      const interval = setInterval(loadLatestLocal, 1500);

      return () => {
        cancelled = true;
        clearInterval(interval);
        client.removeChannel(channel);
      };
    } else {
      // 2. Local REST + SSE Fallback Mode
      loadLatestLocal();

      let eventSource: EventSource | null = null;
      try {
        eventSource = new EventSource(`${API_BASE_URL}/api/events`);
        eventSource.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);
            if (parsed.type === 'pull_run_started' || parsed.type === 'pull_run_updated') {
              const row = parsed.data as PullRun;
              setPullRun(row);
            }
          } catch (e) {
            console.error('Error parsing SSE pull event:', e);
          }
        };
      } catch (err) {
        console.error('SSE initialization error in pull status:', err);
      }

      const interval = setInterval(loadLatestLocal, 1000);

      return () => {
        cancelled = true;
        clearInterval(interval);
        if (eventSource) eventSource.close();
      };
    }
  }, []);

  return { pullRun, loading };
}
