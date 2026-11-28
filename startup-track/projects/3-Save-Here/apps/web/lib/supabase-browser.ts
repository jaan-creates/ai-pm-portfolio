import { createClient } from "@supabase/supabase-js";

type SupabaseClient = ReturnType<typeof createClient>;
let client: SupabaseClient | undefined;

export function configureSupabaseBrowserClient(url: string, anonKey: string) {
  if (typeof window === "undefined" || !url || !anonKey) return null;
  client ??= createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  return client;
}

export function createSupabaseBrowserClient() {
  if (typeof window === "undefined") return null;
  return configureSupabaseBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "");
}
