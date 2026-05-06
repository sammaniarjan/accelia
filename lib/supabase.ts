import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';

let _admin: SupabaseClient | null = null;

/**
 * Server-side admin client (bypasses RLS).
 * Voor MVP gebruiken we deze in alle API routes en server components — RLS staat uit.
 */
export function supabaseAdmin(): SupabaseClient {
  if (!_admin) {
    _admin = createClient(env.supabaseUrl(), env.supabaseServiceKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _admin;
}

/** Public anon client — voor eventueel client-side gebruik. */
export function supabaseAnon(): SupabaseClient {
  return createClient(env.supabaseUrl(), env.supabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
