import { createClient } from "@supabase/supabase-js";

/**
 * Z-COMPASS connects to the owner's own (external) Supabase project.
 * These two values are publishable by design — the publishable/anon key is
 * safe in client code and all access is enforced by Row Level Security.
 */
export const SUPABASE_URL =
  (import.meta.env["VITE_SUPABASE_URL"] as string | undefined) ??
  "https://szrzcffeykegccxvdogh.supabase.co";

export const SUPABASE_PUBLISHABLE_KEY =
  (import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string | undefined) ??
  "sb_publishable_zchOjqhbjO7-KMgBzKMsOw_1HQ4RhVG";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "zcompass-auth",
    flowType: "pkce",
  },
});
