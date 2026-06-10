export const hasCognitoConfig = Boolean(
  process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID && process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
);

export const hasSupabaseConfig = hasCognitoConfig;

export function assertSupabaseConfig() {
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (!hasCognitoConfig) {
    throw new Error("Missing Cognito environment variables. Set NEXT_PUBLIC_COGNITO_USER_POOL_ID and NEXT_PUBLIC_COGNITO_CLIENT_ID.");
  }
}

export const supabaseUrl = "";
export const supabaseAnonKey = "";
export const supabaseServiceRoleKey = "";
