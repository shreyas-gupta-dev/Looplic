import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { isPhoneIdentifier, normalizeIdentifier } from "@/src/lib/auth/admin-users";
import { supabaseUrl } from "@/src/lib/auth/config";
import { hasVerificationSecret, mintVerificationToken } from "@/src/lib/auth/verification-token";
import { guardRateLimit } from "@/src/lib/rate-limit";

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

/**
 * POST /api/auth/verify-otp
 *
 * Verifies the OTP the customer entered and, on success, returns a short-lived
 * signed verification token proving they control that email/phone. That token is
 * what signup and confirm-user require.
 *
 * Rate limited per IP so the 6-digit code cannot be brute forced: 10 attempts per
 * 10 minutes is ~10 of 1,000,000 combinations.
 */
export async function POST(request: Request) {
  const limited = await guardRateLimit(request, "auth:verify-otp", 10, 10 * 60);
  if (limited) return limited;

  try {
    const { identifier, token } = await request.json();

    if (!identifier || typeof identifier !== "string" || !token || typeof token !== "string") {
      return NextResponse.json({ error: "Identifier and OTP token are required" }, { status: 400 });
    }

    if (!serviceRoleKey || !hasVerificationSecret()) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const isPhone = isPhoneIdentifier(identifier);
    const normalizedIdentifier = normalizeIdentifier(identifier);

    // A fresh client, not the shared admin one: verifyOtp establishes a session
    // and must not mutate the long-lived admin client's auth state.
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    let data;
    let error;

    if (isPhone) {
      ({ data, error } = await supabase.auth.verifyOtp({
        phone: normalizedIdentifier,
        token: token.trim(),
        type: "sms",
      }));
    } else {
      // The email OTP type depends on how it was issued: a confirmed user gets an
      // "email"/magiclink OTP, a brand-new user created during signup gets a
      // "signup" confirmation OTP. Try "email" first, fall back to "signup", and
      // keep the original error if the fallback also fails so the customer sees
      // the real "invalid or expired" message.
      ({ data, error } = await supabase.auth.verifyOtp({
        email: normalizedIdentifier,
        token: token.trim(),
        type: "email",
      }));

      if (error) {
        const retry = await supabase.auth.verifyOtp({
          email: normalizedIdentifier,
          token: token.trim(),
          type: "signup",
        });
        if (!retry.error) {
          data = retry.data;
          error = null;
        }
      }
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data?.session && !data?.user) {
      return NextResponse.json({ error: "OTP verification failed" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      verificationToken: mintVerificationToken(normalizedIdentifier),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "OTP verification failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
