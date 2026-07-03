import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { supabaseAnonKey, supabaseUrl } from "@/src/lib/auth/config";

// Server-side Supabase client bound to the request cookies. Use in route
// handlers / server components to read (and, in route handlers, refresh) the
// signed-in user's session.
export async function getServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component where cookies are read-only — safe to ignore.
        }
      },
    },
  });
}

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const hasServiceRole = Boolean(serviceRoleKey);

let adminClient: ReturnType<typeof createClient> | null = null;

// Privileged client (service-role key) for admin user lookups. Never expose to
// the browser.
export function getAdminSupabase() {
  if (!adminClient) {
    adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return adminClient;
}
