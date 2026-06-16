// Auth is handled by Supabase (login for customers, admin, technician, operation).
// The application database stays on Amazon RDS (accessed via the /api/db-proxy
// route and the Drizzle client) — only authentication lives in Supabase.

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
export const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.looplic.com";

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);
