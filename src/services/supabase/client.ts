// Supabase client instance — connects the frontend to the Supabase cloud.
// Reads credentials from environment variables defined in .env (never hardcoded).

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. " +
    "Copy .env.example to .env and fill in VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY."
  );
}

if (supabaseUrl.includes("supabase.com/dashboard")) {
  throw new Error(
    "Invalid VITE_SUPABASE_URL. Use https://YOUR_PROJECT_REF.supabase.co, not the Supabase Dashboard URL."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
