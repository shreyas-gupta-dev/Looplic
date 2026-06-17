import "server-only";

// NOTE: file name kept for import stability — auth now runs on Supabase, not Cognito.
import { getAdminSupabase, getServerSupabase, hasServiceRole } from "@/src/lib/supabase/server";
import { hasSupabaseConfig } from "./config";

export type ServerCognitoUser = {
  id: string;
  email: string | undefined;
  name: string | undefined;
};

export async function getServerSession(): Promise<{ user: ServerCognitoUser | null }> {
  if (!hasSupabaseConfig) return { user: null };

  try {
    const supabase = await getServerSupabase();

    // Fast path: verify the JWT signature locally (no network round-trip).
    // The project signs tokens with ES256, so getClaims() validates against the
    // cached JWKS via WebCrypto. This runs on every protected db-proxy request,
    // so avoiding the /auth/v1/user call materially cuts admin/booking latency.
    try {
      const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
      if (!claimsError && claimsData?.claims?.sub) {
        const claims = claimsData.claims as Record<string, any>;
        const meta = (claims.user_metadata as Record<string, any> | undefined) ?? undefined;
        return {
          user: {
            id: String(claims.sub),
            email: (claims.email as string) ?? undefined,
            name: (meta?.full_name as string) || (meta?.name as string) || undefined,
          },
        };
      }
    } catch {
      // Fall back to network validation below (e.g. symmetric token / no WebCrypto).
    }

    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return { user: null };

    const user = data.user;
    return {
      user: {
        id: user.id,
        email: user.email ?? undefined,
        name:
          (user.user_metadata?.full_name as string) ||
          (user.user_metadata?.name as string) ||
          undefined,
      },
    };
  } catch {
    return { user: null };
  }
}

// Look up a user by their Supabase auth id (service-role only). Returns the
// Supabase user object, or null if unavailable.
export async function adminGetUser(userId: string) {
  if (!hasServiceRole) return null;
  try {
    const admin = getAdminSupabase();
    const { data, error } = await admin.auth.admin.getUserById(userId);
    if (error) return null;
    return data.user ?? null;
  } catch {
    return null;
  }
}
