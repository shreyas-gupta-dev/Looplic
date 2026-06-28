"use client";

// NOTE: file name kept for import stability — auth now runs on Supabase, not Cognito.
import { getBrowserSupabase } from "@/src/lib/supabase/browser";
import { appUrl } from "./config";

export type CognitoUser = {
  id: string;
  email: string | undefined;
  name: string | undefined;
};

export async function getClientSession(): Promise<{ user: CognitoUser | null }> {
  const supabase = getBrowserSupabase();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return { user: null };
  return {
    user: {
      id: user.id,
      email: user.email ?? undefined,
      name: (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || undefined,
    },
  };
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = getBrowserSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password: password.trim(),
  });
  if (error) throw new Error(error.message);
  return { isSignedIn: Boolean(data.session) };
}

export async function signUpWithEmail(email: string, password: string, name: string) {
  const supabase = getBrowserSupabase();
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: { full_name: name },
      emailRedirectTo: `${appUrl}/auth/callback`,
    },
  });
  if (error) throw new Error(error.message);
  // With email confirmation off, a session is returned immediately.
  return { isSignUpComplete: Boolean(data.session) };
}

export async function signInWithGoogle(redirectUrl?: string) {
  const supabase = getBrowserSupabase();
  const origin = typeof window !== "undefined" ? window.location.origin : appUrl;
  const next = redirectUrl && redirectUrl.startsWith("/") ? redirectUrl : "/";
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) throw new Error(error.message);
}

export async function signOutClient() {
  const supabase = getBrowserSupabase();
  await supabase.auth.signOut();
}

export async function getIdToken(): Promise<string | null> {
  const supabase = getBrowserSupabase();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
