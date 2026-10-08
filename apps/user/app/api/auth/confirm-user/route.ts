import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { findAuthUserByEmail, normalizeIdentifier } from "@/src/lib/auth/admin-users";
import { supabaseAnonKey, supabaseUrl } from "@/src/lib/auth/config";
import { hasVerificationSecret, verifyVerificationToken } from "@/src/lib/auth/verification-token";
import { guardRateLimit } from "@/src/lib/rate-limit";
import { getAdminSupabase, hasServiceRole } from "@/src/lib/supabase/server";

/**
 * POST /api/auth/confirm-user
 *
 * Confirms an unverified email so the account can sign in. Called from the login
 * flow when signInWithPassword reports "Email not confirmed".
 *
 * Authenticates the request via either:
 *  1. Correct account password (validated with Supabase auth)
 *  2. A valid, signed OTP verification token
 *
 * If neither is provided or valid, refuses with 400 without revealing account existence.
 */
export async function POST(request: Request) {
  const limited = await guardRateLimit(request, "auth:confirm-user", 10, 15 * 60);
  if (limited) return limited;

  // Uniform success response: never reveals whether the address exists, whether
  // it was already confirmed, or whether anything changed.
  const uniformOk = NextResponse.json({ success: true });

  try {
    const { email, password, verificationToken } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!hasServiceRole) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const normalizedEmail = normalizeIdentifier(email);

    let isAuthorized = false;

    // 1. Verify via signed OTP verification token
    if (verificationToken && typeof verificationToken === "string") {
      const check = verifyVerificationToken(verificationToken, normalizedEmail);
      if (check.valid) {
        isAuthorized = true;
      } else if (!password) {
        return NextResponse.json(
          { error: "OTP verification expired or invalid. Please verify again." },
          { status: 400 },
        );
      }
    }

    // 2. Verify via account password if token was not provided/valid
    if (!isAuthorized && password && typeof password === "string" && password.trim()) {
      try {
        const client = createClient(supabaseUrl, supabaseAnonKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });
        const { error } = await client.auth.signInWithPassword({
          email: normalizedEmail,
          password: password.trim(),
        });
        // If error is "Email not confirmed", credentials were verified and accepted by Supabase!
        if (!error || error.message.toLowerCase().includes("email not confirmed") || error.message.toLowerCase().includes("email_not_confirmed")) {
          isAuthorized = true;
        }
      } catch (err) {
        console.warn("[confirm-user] Password verification error:", err);
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "OTP verification is required to confirm this account" },
        { status: 400 },
      );
    }

    const admin = getAdminSupabase();
    // Paginated: the previous unpaginated listUsers() reported "User not found"
    // for every user past the first page.
    const user = await findAuthUserByEmail(admin, normalizedEmail);

    if (!user) return uniformOk;

    await admin.auth.admin.updateUserById(user.id, { email_confirm: true });

    return uniformOk;
  } catch {
    // Even on an internal failure, do not leak whether the address exists.
    return uniformOk;
  }
}

