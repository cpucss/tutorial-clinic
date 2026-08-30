// Supabase client instance — connects the frontend to the Supabase cloud.
// Reads credentials from environment variables defined in .env (never hardcoded).

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database.types";

const envUrl = import.meta.env.VITE_SUPABASE_URL || (typeof process !== "undefined" ? process.env?.VITE_SUPABASE_URL : undefined);
const envKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || (typeof process !== "undefined" ? process.env?.VITE_SUPABASE_PUBLISHABLE_KEY : undefined);

const isTestEnv = import.meta.env.MODE === "test" || (typeof process !== "undefined" && process.env?.NODE_ENV === "test");

const supabaseUrl = envUrl || (isTestEnv ? "https://test-placeholder-project.supabase.co" : "");
const supabaseAnonKey = envKey || (isTestEnv ? "test-placeholder-anon-key" : "");

if (!isTestEnv) {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      "Missing Supabase environment variables. " +
      "Copy .env.example to .env and fill in VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY."
    );
  }

  if (supabaseUrl.includes("supabase.com/dashboard")) {
    throw new Error(
      "Invalid VITE_SUPABASE_URL. Use https://YOUR_PROJECT_REF.supabase.co, not the Supabase Dashboard URL."
    );
  }
}

export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
