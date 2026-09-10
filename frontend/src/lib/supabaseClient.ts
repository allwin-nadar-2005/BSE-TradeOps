import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(
  url &&
    anonKey &&
    url.startsWith('http') &&
    !url.includes('your-project') &&
    !anonKey.includes('your-anon-key')
);

if (isSupabaseConfigured) {
  console.log('[Frontend] Connecting to Supabase Realtime...');
} else {
  console.log('[Frontend] Supabase credentials not provided. Using backend REST + SSE fallback.');
}

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!)
  : null;
