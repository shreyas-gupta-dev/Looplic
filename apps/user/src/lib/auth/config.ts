// Auth is handled by Supabase (login for customers, admin, technician, operation).
// Application database and authentication run on Supabase.

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
export const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://looplic.com";

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);
