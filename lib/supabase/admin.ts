import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function hasServiceRoleEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/** Server-only client that bypasses RLS. Never import from client components. */
export function createServiceClient(): SupabaseClient {
  if (!hasServiceRoleEnv()) throw new Error("Supabase service role is not configured.");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
