"use client";

import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/src/lib/supabase/browser";
import { hasSupabaseConfig } from "@/src/lib/auth/config";

type RoleName = "admin" | "operation" | "technician";

export type AppUser = {
  id: string;
  email: string | undefined;
  user_metadata?: { full_name?: string };
};

// Clears any leftover auth tokens from older deployments (legacy Cognito/Amplify
// keys and stale Supabase keys) from both localStorage and cookies. Harmless to
// call at any time; kept exported for the admin login screen.
export function wipeStaleCognitoTokens() {
  if (typeof window === "undefined") return;
  try {
    for (const key of Object.keys(window.localStorage)) {
      if (
        key.startsWith("CognitoIdentityServiceProvider") ||
        key.startsWith("amplify-") ||
        key.startsWith("sb-")
      ) {
        window.localStorage.removeItem(key);
      }
    }
  } catch {
    /* ignore */
  }
  try {
    for (const cookie of document.cookie.split(";")) {
      const name = cookie.split("=")[0]?.trim();
      if (name && name.startsWith("CognitoIdentityServiceProvider")) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      }
    }
  } catch {
    /* ignore */
  }
}

async function getCurrentUser(): Promise<AppUser | null> {
  const supabase = getBrowserSupabase();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return null;
  return {
    id: user.id,
    email: user.email ?? undefined,
    user_metadata: { full_name: (user.user_metadata?.full_name as string) || "" },
  };
}

async function checkUserRole(userId: string, role: RoleName, accessToken?: string): Promise<boolean> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
    const res = await fetch("/api/auth/check-role", {
      method: "POST",
      headers,
      body: JSON.stringify({ userId, role }),
    });
    if (!res.ok) return false;
    const json = await res.json();
    return Boolean(json.hasRole);
  } catch {
    return false;
  }
}

export function useRoleSession(role: RoleName) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [hasRole, setHasRole] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasSupabaseConfig) {
      setLoading(false);
      return;
    }

    let ignore = false;

    async function checkSession() {
      const currentUser = await getCurrentUser();
      if (ignore) return;

      if (!currentUser) {
        setUser(null);
        setHasRole(false);
        setLoading(false);
        return;
      }

      setUser(currentUser);

      const roleOk = await checkUserRole(currentUser.id, role);
      if (!ignore) {
        setHasRole(roleOk);
        setLoading(false);
      }
    }

    checkSession();

    return () => {
      ignore = true;
    };
  }, [role]);

  async function signInFn(email: string, password: string) {
    if (!hasSupabaseConfig) throw new Error("Missing Supabase configuration.");

    const supabase = getBrowserSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password.trim(),
    });

    if (error) {
      return { error: { message: error.message } };
    }

    if (data.session) {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      let roleOk = false;
      if (currentUser) {
        roleOk = await checkUserRole(currentUser.id, role, data.session.access_token);
        setHasRole(roleOk);
      }
      if (!roleOk) {
        return { error: { message: `Signed in, but this account does not have ${role} access.` } };
      }
      return { error: null };
    }

    return { error: { message: "Sign in incomplete" } };
  }

  async function signOutFn() {
    const supabase = getBrowserSupabase();
    await supabase.auth.signOut();
    setUser(null);
    setHasRole(false);
  }

  return { user, hasRole, loading, signIn: signInFn, signOut: signOutFn };
}
