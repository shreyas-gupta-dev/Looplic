"use client";

import { Amplify } from "aws-amplify";
import { fetchAuthSession, signIn, signOut } from "aws-amplify/auth";
import { useEffect, useState } from "react";
import { amplifyConfig, hasCognitoConfig } from "@/src/lib/auth/config";

type RoleName = "admin" | "operation" | "technician";

export type AppUser = {
  id: string;
  email: string | undefined;
  user_metadata?: { full_name?: string };
};

let amplifyConfigured = false;

function ensureAmplify() {
  if (!amplifyConfigured && hasCognitoConfig) {
    Amplify.configure(amplifyConfig, { ssr: true });
    amplifyConfigured = true;
  }
}

async function getCurrentUser(): Promise<AppUser | null> {
  ensureAmplify();
  try {
    const { tokens } = await fetchAuthSession();
    if (!tokens?.idToken) return null;
    const payload = tokens.idToken.payload;
    return {
      id: String(payload.sub || ""),
      email: String(payload.email || ""),
      user_metadata: { full_name: String(payload.name || "") },
    };
  } catch {
    return null;
  }
}

async function checkUserRole(userId: string, role: RoleName): Promise<boolean> {
  try {
    const res = await fetch("/api/db-proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        table: "user_roles",
        select: "role",
        filters: [
          ["eq", "user_id", userId],
          ["eq", "role", role],
        ],
        single: true,
      }),
    });
    if (!res.ok) return false;
    const json = await res.json();
    return Boolean(json.data);
  } catch {
    return false;
  }
}

export function useRoleSession(role: RoleName) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [hasRole, setHasRole] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasCognitoConfig) {
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
    if (!hasCognitoConfig) throw new Error("Missing Cognito configuration.");
    ensureAmplify();
    // Clear any stale session before signing in
    try { await signOut(); } catch { /* no active session, ignore */ }
    const result = await signIn({
      username: email.trim().toLowerCase(),
      password: password.trim(),
    });
    if (result.isSignedIn) {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      if (currentUser) {
        const roleOk = await checkUserRole(currentUser.id, role);
        setHasRole(roleOk);
      }
      return { error: null };
    }
    return { error: { message: "Sign in incomplete" } };
  }

  async function signOutFn() {
    ensureAmplify();
    await signOut();
    setUser(null);
    setHasRole(false);
  }

  return { user, hasRole, loading, signIn: signInFn, signOut: signOutFn };
}
