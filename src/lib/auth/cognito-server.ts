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
