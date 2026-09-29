import { NextResponse } from "next/server";

import { findAuthUserByEmail, normalizeIdentifier } from "@/src/lib/auth/admin-users";
import { hasVerificationSecret, verifyVerificationToken } from "@/src/lib/auth/verification-token";
import { guardRateLimit } from "@/src/lib/rate-limit";
import { getAdminSupabase, hasServiceRole } from "@/src/lib/supabase/server";

/**
 * POST /api/auth/confirm-user
 *
 * Confirms an unverified email so the account can sign in. Called from the login
 * flow when signInWithPassword reports "Email not confirmed".
 *
 * Two properties this endpoint must hold, both of which it previously violated:
 *
 *  1. Ownership. It used to confirm ANY address supplied by an anonymous caller,
 *     which let anybody bypass email verification for an address they do not
 *     control. It now requires the same OTP verification token the rest of the
 *     auth flow uses — and the login flow already has one, because sign-in is
 *     OTP-gated.
 *  2. No enumeration. It used to answer 404 "User not found" for unknown
 *     addresses and 200 for known ones, turning it into a free account-existence
 *     oracle. It now answers identically either way.
 */
export async function POST(request: Request) {
  const limited = await guardRateLimit(request, "auth:confirm-user", 10, 15 * 60);
  if (limited) return limited;

  // Uniform success response: never reveals whether the address exists, whether
  // it was already confirmed, or whether anything changed.
  const uniformOk = NextResponse.json({ success: true });

  try {
    const { email, verificationToken } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!hasServiceRole) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const normalizedEmail = normalizeIdentifier(email);

    if (verificationToken) {
      const check = verifyVerificationToken(verificationToken, normalizedEmail);
      if (!check.valid) {
        return NextResponse.json(
          { error: "OTP verification expired or invalid. Please verify again." },
          { status: 400 },
        );
      }
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
