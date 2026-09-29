import { NextResponse } from "next/server";

import { findAuthUserByEmail, isPhoneIdentifier, normalizeIdentifier } from "@/src/lib/auth/admin-users";
import { hasVerificationSecret, verifyVerificationToken } from "@/src/lib/auth/verification-token";
import { guardRateLimit } from "@/src/lib/rate-limit";
import { getAdminSupabase, hasServiceRole } from "@/src/lib/supabase/server";

/**
 * POST /api/auth/signup
 *
 * Creates (or completes) a user via the admin API, which bypasses the email
 * confirmation round-trip. Requires a valid OTP verification token, so the
 * caller must already have proved control of the email/phone.
 */
export async function POST(request: Request) {
  // Account creation is expensive and abusable; cap it well below the OTP limit.
  const limited = await guardRateLimit(request, "auth:signup", 5, 15 * 60);
  if (limited) return limited;

  try {
    const { email, phone, password, name, verificationToken } = await request.json();

    const rawIdentifier = typeof phone === "string" && phone.trim() ? phone : email;

    if (!rawIdentifier || typeof rawIdentifier !== "string") {
      return NextResponse.json({ error: "Email or phone number is required" }, { status: 400 });
    }

    if (typeof password !== "string" || password.trim().length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    if (!verificationToken || typeof verificationToken !== "string") {
      return NextResponse.json({ error: "OTP verification is required before creating an account" }, { status: 400 });
    }

    if (!hasServiceRole || !hasVerificationSecret()) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const isPhone = isPhoneIdentifier(rawIdentifier);
    const normalizedIdentifier = normalizeIdentifier(rawIdentifier);

    const check = verifyVerificationToken(verificationToken, normalizedIdentifier);
    if (!check.valid) {
      return NextResponse.json(
        { error: "OTP verification expired or invalid. Please verify again." },
        { status: 400 },
      );
    }

    const admin = getAdminSupabase();
    const trimmedPassword = password.trim();
    const fullName = typeof name === "string" ? name : "";

    // The OTP step creates a passwordless user for new email signups
    // (signInWithOtp with shouldCreateUser: true). That user must be completed
    // with a password rather than created again, otherwise createUser fails with
    // "already been registered" and the customer is locked out of an account
    // they can never sign into. This lookup MUST be paginated — the previous
    // unpaginated listUsers() only saw the first 50 users, which is exactly how
    // that lockout happened in production.
    if (!isPhone) {
      const existingUser = await findAuthUserByEmail(admin, normalizedIdentifier);

      if (existingUser) {
        const { data, error } = await admin.auth.admin.updateUserById(existingUser.id, {
          password: trimmedPassword,
          email_confirm: true,
          user_metadata: { full_name: fullName },
        });

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, userId: data.user.id });
      }
    }

    const createPayload: Record<string, unknown> = {
      password: trimmedPassword,
      email_confirm: true,
      phone_confirm: true,
      user_metadata: { full_name: fullName },
    };

    if (isPhone) {
      createPayload.phone = normalizedIdentifier;
    } else {
      createPayload.email = normalizedIdentifier;
    }

    const { data, error } = await admin.auth.admin.createUser(createPayload as never);

    if (error) {
      if (error.message.includes("already been registered") || error.message.includes("already exists")) {
        return NextResponse.json(
          { error: "An account with this email/phone already exists. Please sign in instead." },
          { status: 409 },
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, userId: data.user.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Signup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
