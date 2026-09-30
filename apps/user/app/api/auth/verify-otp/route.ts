import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { findAuthUserByEmail, isPhoneIdentifier, normalizeIdentifier } from "@/src/lib/auth/admin-users";
import { supabaseUrl } from "@/src/lib/auth/config";
import { verifyEmailOtp } from "@/src/lib/auth/email-otp";
import { hasVerificationSecret, mintVerificationToken } from "@/src/lib/auth/verification-token";
import { guardRateLimit } from "@/src/lib/rate-limit";
import { getAdminSupabase, hasServiceRole } from "@/src/lib/supabase/server";

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

/**
 * POST /api/auth/verify-otp
 *
 * Verifies the 6-digit OTP the customer entered and, on success, returns a short-lived
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
    let magicLinkTokenHash: string | undefined;

    if (isPhone) {
      // A fresh client, not the shared admin one: verifyOtp establishes a session
      // and must not mutate the long-lived admin client's auth state.
      const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data, error } = await supabase.auth.verifyOtp({
        phone: normalizedIdentifier,
        token: token.trim(),
        type: "sms",
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      if (!data?.session && !data?.user) {
        return NextResponse.json({ error: "OTP verification failed" }, { status: 400 });
      }
    } else {
      const check = await verifyEmailOtp(normalizedIdentifier, token.trim());
      if (!check.valid) {
        return NextResponse.json({ error: check.error || "Invalid OTP code" }, { status: 400 });
      }

      if (hasServiceRole) {
        try {
          const admin = getAdminSupabase();
          const existingUser = await findAuthUserByEmail(admin, normalizedIdentifier);
          if (existingUser) {
            await admin.auth.admin.updateUserById(existingUser.id, { email_confirm: true });
            const linkRes = await admin.auth.admin.generateLink({
              type: "magiclink",
              email: normalizedIdentifier,
            });
            if (linkRes.data?.properties?.hashed_token) {
              magicLinkTokenHash = linkRes.data.properties.hashed_token;
            }
          }
        } catch (err) {
          console.warn("[verify-otp] Could not generate magiclink hash for existing user:", err);
        }
      }
    }

    return NextResponse.json({
      success: true,
      verificationToken: mintVerificationToken(normalizedIdentifier),
      ...(magicLinkTokenHash ? { magicLinkTokenHash } : {}),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "OTP verification failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

