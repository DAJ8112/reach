import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.js';

// Service-role client. Bypasses RLS — use only in server code.
export const supabaseAdmin: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

// Anon client used to verify a user's JWT.
const anonClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export async function getUserFromJwt(jwt: string) {
  const { data, error } = await anonClient.auth.getUser(jwt);
  if (error || !data.user) return null;
  return data.user;
}
