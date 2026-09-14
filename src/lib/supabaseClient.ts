import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigError =
  !supabaseUrl || !supabaseAnonKey
    ? "Missing Supabase env vars. Copy .env.example to .env and fill in " +
      "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from your Supabase " +
      "project settings (Project Settings > API), then restart the dev server."
    : null;

// Fall back to obviously-fake placeholders when unset so createClient()
// doesn't throw at import time — every real call will still fail loudly,
// and the UI checks supabaseConfigError first to show a clear message.
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key",
);
