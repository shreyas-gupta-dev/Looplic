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

// Wipe any lingering Cognito tokens from BOTH localStorage and cookies.
// Older deployments stored tokens in localStorage; the current SSR config uses
// cookies, so a normal signOut() can leave the other store's tokens behind,
// which makes signIn() throw "There is already a signed in user".
export function wipeStaleCognitoTokens() {
  if (typeof window === "undefined") return;
  try {
    for (const key of Object.keys(window.localStorage)) {
      if (key.startsWith("CognitoIdentityServiceProvider") || key.startsWith("amplify-")) {
        window.localStorage.removeItem(key);
      }
    }
  } catch { /* ignore */ }
  try {
    for (const cookie of document.cookie.split(";")) {
      const name = cookie.split("=")[0]?.trim();
      if (name && name.startsWith("CognitoIdentityServiceProvider")) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      }
    }
  } catch { /* ignore */ }
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
    // Force re-init to flush any stale in-memory token state from conflicting configure calls
    amplifyConfigured = false;
    ensureAmplify();

    const username = email.trim().toLowerCase();
    const pwd = password.trim();

    // Clear any stale session before signing in
    try { await signOut(); } catch { /* no active session, ignore */ }
    wipeStaleCognitoTokens();

    async function attemptSignIn() {
      return signIn({ username, password: pwd });
    }

    let result;
    try {
      result = await attemptSignIn();
    } catch (err: any) {
      const msg = String(err?.message || "");
      // Amplify throws this when a stale session lingers despite the signOut above.
      // Force a global sign-out to wipe cookies/localStorage, then retry once.
      if (msg.includes("already a signed in user") || err?.name === "UserAlreadyAuthenticatedException") {
        // Local sign-out (no network needed) + storage wipe clears both the
        // in-memory token provider and any persisted tokens, then retry.
        try { await signOut(); } catch { /* ignore */ }
        wipeStaleCognitoTokens();
        try { await signOut(); } catch { /* ignore */ }
        result = await attemptSignIn();
      } else {
        throw err;
      }
    }

    if (result.isSignedIn) {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      let roleOk = false;
      if (currentUser) {
        roleOk = await checkUserRole(currentUser.id, role);
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
    ensureAmplify();
    await signOut();
    setUser(null);
    setHasRole(false);
  }

  return { user, hasRole, loading, signIn: signInFn, signOut: signOutFn };
}
