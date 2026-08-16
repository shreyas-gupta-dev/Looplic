import { NextResponse } from "next/server";
import { getAdminSupabase, hasServiceRole } from "@/src/lib/supabase/server";

/**
 * POST /api/auth/send-otp
 * Sends an OTP to the given email or phone number.
 * For email: uses Supabase's built-in email OTP.
 * For phone: uses Supabase's built-in phone OTP (requires Twilio setup in Supabase dashboard).
 *
 * We generate and store a 6-digit OTP server-side, then send it via Supabase.
 */
export async function POST(request: Request) {
  try {
    const { identifier } = await request.json();

    if (!identifier || typeof identifier !== "string") {
      return NextResponse.json({ error: "Email or phone number is required" }, { status: 400 });
    }

    if (!hasServiceRole) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const isPhone = identifier.startsWith("+");
    const normalizedIdentifier = isPhone ? identifier.trim() : identifier.trim().toLowerCase();

    // Validate format
    if (isPhone) {
      // Basic phone validation: must be +<country code><number>, at least 10 digits
      const phoneDigits = normalizedIdentifier.replace(/[^0-9]/g, "");
      if (phoneDigits.length < 10 || phoneDigits.length > 15) {
        return NextResponse.json({ error: "Invalid phone number format. Use +91XXXXXXXXXX" }, { status: 400 });
      }
    } else {
      // Basic email validation
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedIdentifier)) {
        return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
      }
    }

    const admin = getAdminSupabase();

    // Supabase handles OTP generation, storage, and delivery internally.

    if (isPhone) {
      // Supabase handles phone OTP via configured SMS provider (Twilio)
      const { error } = await admin.auth.signInWithOtp({
        phone: normalizedIdentifier,
      });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    } else {
      // Supabase handles email OTP delivery
      const { error } = await admin.auth.signInWithOtp({
        email: normalizedIdentifier,
        options: {
          shouldCreateUser: false, // Don't auto-create — we handle signup separately
        },
      });

      // If user doesn't exist yet (signup flow), we still need to send OTP
      // Supabase returns error for non-existent users when shouldCreateUser=false
      if (error) {
        // Try again with shouldCreateUser: true — this creates a passwordless user
        // that we'll convert to password user on actual signup
        const { error: retryError } = await admin.auth.signInWithOtp({
          email: normalizedIdentifier,
          options: {
            shouldCreateUser: true,
          },
        });
        if (retryError) {
          return NextResponse.json({ error: retryError.message }, { status: 400 });
        }
      }
    }

    return NextResponse.json({ success: true, message: `OTP sent to ${isPhone ? "phone" : "email"}` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to send OTP" }, { status: 500 });
  }
}
