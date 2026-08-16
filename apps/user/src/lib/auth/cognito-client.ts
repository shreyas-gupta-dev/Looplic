"use client";

// NOTE: file name kept for import stability — auth now runs on Supabase, not Cognito.
import { getBrowserSupabase } from "@/src/lib/supabase/browser";
import { appUrl } from "./config";

export type CognitoUser = {
  id: string;
  email: string | undefined;
  phone: string | undefined;
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
      phone: user.phone ?? undefined,
      name: (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || undefined,
    },
  };
}

/**
 * Send OTP to an email or phone number via the server-side API route.
 * For email: Supabase sends an OTP code to the inbox.
 * For phone: Supabase sends an SMS OTP.
 */
export async function sendOtp(identifier: string): Promise<{ success: boolean }> {
  const res = await fetch("/api/auth/send-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier }),
  });

  const result = await res.json();
  if (!res.ok) {
    throw new Error(result.error || "Failed to send OTP");
  }

  return { success: true };
}

/**
 * Verify the OTP code entered by the user.
 * Works for both email and phone OTP verification.
 * Returns a verification token that can be passed to signup/signin.
 */
export async function verifyOtp(
  identifier: string,
  token: string,
): Promise<{ isVerified: boolean; verificationToken?: string }> {
  const res = await fetch("/api/auth/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, token }),
  });

  const result = await res.json();
  if (!res.ok) {
    throw new Error(result.error || "OTP verification failed");
  }

  return { isVerified: true, verificationToken: result.verificationToken };
}

/**
 * Sign in with email/phone + password. Requires prior OTP verification.
 */
export async function signInWithEmail(email: string, password: string) {
  const supabase = getBrowserSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password: password.trim(),
  });

  if (error) {
    if (error.message.includes("Email not confirmed") || error.message.includes("email_not_confirmed")) {
      const confirmResponse = await fetch("/api/auth/confirm-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      if (confirmResponse.ok) {
        const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password: password.trim(),
        });
        if (retryError) throw new Error(retryError.message);
        return { isSignedIn: Boolean(retryData.session) };
      }
    }
    throw new Error(error.message);
  }

  return { isSignedIn: Boolean(data.session) };
}

/**
 * Sign in with phone + password. Requires prior OTP verification.
 */
export async function signInWithPhone(phone: string, password: string) {
  const supabase = getBrowserSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({
    phone: phone.trim(),
    password: password.trim(),
  });

  if (error) throw new Error(error.message);
  return { isSignedIn: Boolean(data.session) };
}

/**
 * Sign up with email + password. Requires prior OTP verification (verificationToken).
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  name: string,
  verificationToken: string,
) {
  const response = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password: password.trim(),
      name,
      verificationToken,
    }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Sign up failed");
  }

  // User is created and confirmed — sign them in immediately
  const supabase = getBrowserSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password: password.trim(),
  });

  if (error) throw new Error(error.message);
  return { isSignUpComplete: Boolean(data.session) };
}

/**
 * Sign up with phone + password. Requires prior OTP verification (verificationToken).
 */
export async function signUpWithPhone(
  phone: string,
  password: string,
  name: string,
  verificationToken: string,
) {
  const response = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phone: phone.trim(),
      password: password.trim(),
      name,
      verificationToken,
    }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Sign up failed");
  }

  // User is created and confirmed — sign them in immediately
  const supabase = getBrowserSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({
    phone: phone.trim(),
    password: password.trim(),
  });

  if (error) throw new Error(error.message);
  return { isSignUpComplete: Boolean(data.session) };
}

// Base URL that auth providers send the user back to.
function authRedirectBase() {
  if (typeof window !== "undefined") {
    const { origin, hostname } = window.location;
    if (hostname === "www.looplic.com") return origin;
    if (hostname === "looplic.com" || hostname.endsWith(".looplic.com")) return appUrl;
  }
  return appUrl;
}

export async function signInWithGoogle(redirectUrl?: string) {
  const supabase = getBrowserSupabase();
  const origin = authRedirectBase();
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
