"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "@/src/lib/auth/config";

let client: ReturnType<typeof createBrowserClient> | null = null;

// Single shared browser client. @supabase/ssr stores the session in cookies so
// the server (db-proxy, OAuth callback) can read it too.
export function getBrowserSupabase() {
  if (!client) {
    client = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return client;
}
