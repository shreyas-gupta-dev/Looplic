import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "@/src/lib/auth/config";
import crypto from "crypto";

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

/**
 * POST /api/auth/verify-otp
 * Verifies the OTP code entered by the user.
 * Returns a short-lived verification token that proves the user owns the email/phone.
 * This token is required for signup and sign-in completion.
 */
export async function POST(request: Request) {
  try {
    const { identifier, token } = await request.json();

    if (!identifier || !token) {
      return NextResponse.json({ error: "Identifier and OTP token are required" }, { status: 400 });
    }

    if (!serviceRoleKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const isPhone = identifier.startsWith("+");
    const normalizedIdentifier = isPhone ? identifier.trim() : identifier.trim().toLowerCase();

    // Use a fresh Supabase client (not the admin one) to verify OTP
    // because verifyOtp needs to create a session for the user
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify the OTP. For phone it's always the "sms" type. For email the token
    // type depends on how it was issued: an existing (confirmed) user receives a
    // "email"/magiclink OTP, whereas a brand-new user created during the signup
    // flow (signInWithOtp with shouldCreateUser=true, mailer_autoconfirm off)
    // receives a "signup" confirmation OTP. We try "email" first and fall back to
    // "signup" so both login and first-time signup verification succeed.
    let data;
    let error;
    if (isPhone) {
      ({ data, error } = await supabase.auth.verifyOtp({
        phone: normalizedIdentifier,
        token: token.trim(),
        type: "sms",
      }));
    } else {
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
        // Only adopt the retry result if it actually succeeded; otherwise keep
        // the original error so the user sees the real "invalid/expired" message.
        if (!retry.error) {
          data = retry.data;
          error = null;
        }
      }
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data.session && !data.user) {
      return NextResponse.json({ error: "OTP verification failed" }, { status: 400 });
    }

    // Generate a short-lived verification token (HMAC-signed)
    // This proves the user verified their email/phone and is valid for 10 minutes
    const timestamp = Date.now();
    const payload = `${normalizedIdentifier}:${timestamp}`;
    const secret = serviceRoleKey; // Using service role key as HMAC secret
    const hmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    const verificationToken = Buffer.from(JSON.stringify({ identifier: normalizedIdentifier, timestamp, hmac })).toString("base64url");

    return NextResponse.json({
      success: true,
      verificationToken,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "OTP verification failed" }, { status: 500 });
  }
}
