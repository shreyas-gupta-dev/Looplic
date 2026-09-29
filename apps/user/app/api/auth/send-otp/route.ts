import { NextResponse } from "next/server";

import { isPhoneIdentifier, normalizeIdentifier } from "@/src/lib/auth/admin-users";
import { guardRateLimit } from "@/src/lib/rate-limit";
import { getAdminSupabase, hasServiceRole } from "@/src/lib/supabase/server";

/**
 * POST /api/auth/send-otp
 *
 * Sends a one-time password to an email address or phone number via Supabase.
 * Supabase owns OTP generation, storage and delivery; we only trigger it.
 *
 * Rate limited per IP: each request spends real email/SMS quota against an
 * address the caller does not have to own, so an unmetered endpoint here is both
 * a cost and an abuse problem.
 */
export async function POST(request: Request) {
  const limited = await guardRateLimit(request, "auth:send-otp", 5, 10 * 60);
  if (limited) return limited;

  try {
    const { identifier } = await request.json();

    if (!identifier || typeof identifier !== "string") {
      return NextResponse.json({ error: "Email or phone number is required" }, { status: 400 });
    }

    if (!hasServiceRole) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const isPhone = isPhoneIdentifier(identifier);
    const normalizedIdentifier = normalizeIdentifier(identifier);

    if (isPhone) {
      const phoneDigits = normalizedIdentifier.replace(/[^0-9]/g, "");
      if (phoneDigits.length < 10 || phoneDigits.length > 15) {
        return NextResponse.json({ error: "Invalid phone number format. Use +91XXXXXXXXXX" }, { status: 400 });
      }
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedIdentifier)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const admin = getAdminSupabase();

    if (isPhone) {
      // Phone OTP goes out through the SMS provider configured in Supabase.
      const { error } = await admin.auth.signInWithOtp({ phone: normalizedIdentifier });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: "OTP sent to phone" });
    }

    // Existing users get a magiclink-type OTP. Brand-new users do not exist yet,
    // and Supabase refuses with shouldCreateUser: false, so we retry allowing
    // creation — that produces a passwordless user which /api/auth/signup then
    // completes with a password.
    const { error } = await admin.auth.signInWithOtp({
      email: normalizedIdentifier,
      options: { shouldCreateUser: false },
    });

    if (error) {
      const { error: retryError } = await admin.auth.signInWithOtp({
        email: normalizedIdentifier,
        options: { shouldCreateUser: true },
      });
      if (retryError) {
        return NextResponse.json({ error: retryError.message }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true, message: "OTP sent to email" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to send OTP";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
