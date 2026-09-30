import { NextResponse } from "next/server";

import { isPhoneIdentifier, normalizeIdentifier } from "@/src/lib/auth/admin-users";
import { generateAndSaveEmailOtp } from "@/src/lib/auth/email-otp";
import { sendOtpEmail } from "@/src/lib/email/resend";
import { guardRateLimit } from "@/src/lib/rate-limit";
import { getAdminSupabase, hasServiceRole } from "@/src/lib/supabase/server";

/**
 * POST /api/auth/send-otp
 *
 * Sends a 6-digit one-time password to an email address (via Resend) or
 * phone number (via Supabase SMS).
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

      const admin = getAdminSupabase();
      // Phone OTP goes out through the SMS provider configured in Supabase.
      const { error } = await admin.auth.signInWithOtp({ phone: normalizedIdentifier });
      if (error) {
        return NextResponse.json({ error: friendlyOtpError(error.message) }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: "OTP sent to phone" });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedIdentifier)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    // Generate 6-digit numeric OTP and save to database
    const otpCode = await generateAndSaveEmailOtp(normalizedIdentifier);

    // Send email via Resend directly from Looplic <support@looplic.com>
    const emailRes = await sendOtpEmail({
      to: normalizedIdentifier,
      code: otpCode,
    });

    if (!emailRes.ok) {
      console.error("[send-otp] Failed to deliver OTP email via Resend:", emailRes.error);
      return NextResponse.json(
        { error: "Failed to send verification email. Please check your email address or try again later." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, message: "OTP sent to email" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to send OTP";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Translate Supabase's raw rate-limit message into a clearer, user-facing hint.
 */
function friendlyOtpError(message: string): string {
  if (/only request this after|rate limit|too many/i.test(message)) {
    return "Please wait a few seconds before requesting another code, then try again.";
  }
  return message;
}

