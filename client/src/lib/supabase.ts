import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const key = import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  throw new Error("Supabase public configuration is missing");
}

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
