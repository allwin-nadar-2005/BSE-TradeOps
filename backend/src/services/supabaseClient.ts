import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfigured = Boolean(
  url &&
    serviceRoleKey &&
    url.startsWith('http') &&
    !url.includes('your-project') &&
    !serviceRoleKey.includes('your-service-role-key')
);

if (isSupabaseConfigured) {
  console.log('[Backend] Supabase is configured. Connecting to Supabase...');
} else {
  console.log('[Backend] Supabase credentials not set or placeholder. Running in local in-memory fallback mode.');
}

// Service-role client: bypasses RLS. Backend-only, never send this key to the browser.
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, serviceRoleKey!, {
      auth: { persistSession: false },
    })
  : null;

