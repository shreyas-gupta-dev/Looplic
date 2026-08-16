import { NextResponse } from "next/server";
import { getAdminSupabase, hasServiceRole } from "@/src/lib/supabase/server";
import crypto from "crypto";

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

/**
 * Validate the verification token generated after OTP verification.
 * Token is valid for 10 minutes.
 */
function validateVerificationToken(verificationToken: string, expectedIdentifier: string): boolean {
  try {
    const decoded = JSON.parse(Buffer.from(verificationToken, "base64url").toString("utf8"));
    const { identifier, timestamp, hmac } = decoded;

    // Check identifier matches
    if (identifier !== expectedIdentifier) return false;

    // Check token is not older than 10 minutes
    const age = Date.now() - timestamp;
    if (age > 10 * 60 * 1000) return false;

    // Verify HMAC
    const payload = `${identifier}:${timestamp}`;
    const expectedHmac = crypto.createHmac("sha256", serviceRoleKey).update(payload).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(hmac, "hex"), Buffer.from(expectedHmac, "hex"));
  } catch {
    return false;
  }
}

/**
 * POST /api/auth/signup
 * Creates a user via the admin API (service role) which bypasses email
 * confirmation. Requires a valid OTP verification token.
 */
export async function POST(request: Request) {
  try {
    const { email, phone, password, name, verificationToken } = await request.json();

    const identifier = email || phone;
    const isPhone = Boolean(phone);

    if (!identifier) {
      return NextResponse.json({ error: "Email or phone number is required" }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    if (!verificationToken) {
      return NextResponse.json({ error: "OTP verification is required before creating an account" }, { status: 400 });
    }

    if (!hasServiceRole) {
      return NextResponse.json({ error: "Server configuration error: missing service role key" }, { status: 500 });
    }

    // Validate the verification token
    const normalizedIdentifier = isPhone ? phone.trim() : email.trim().toLowerCase();
    if (!validateVerificationToken(verificationToken, normalizedIdentifier)) {
      return NextResponse.json({ error: "OTP verification expired or invalid. Please verify again." }, { status: 400 });
    }

    const admin = getAdminSupabase();

    // Check if a passwordless user was created during OTP flow (email case)
    // If so, update them with a password instead of creating a new user
    if (!isPhone) {
      const { data: listData } = await admin.auth.admin.listUsers();
      const users = listData?.users ?? [];
      const existingUser = users.find(
        (u: any) => u.email?.toLowerCase() === normalizedIdentifier
      );

      if (existingUser) {
        // User already exists (created by signInWithOtp) — update with password and metadata
        const { data, error } = await admin.auth.admin.updateUserById(existingUser.id, {
          password: password.trim(),
          email_confirm: true,
          user_metadata: { full_name: name || "" },
        });

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, userId: data.user.id });
      }
    }

    // Create user with admin API — this auto-confirms
    const createPayload: any = {
      password: password.trim(),
      email_confirm: true,
      phone_confirm: true,
      user_metadata: { full_name: name || "" },
    };

    if (isPhone) {
      createPayload.phone = normalizedIdentifier;
    } else {
      createPayload.email = normalizedIdentifier;
    }

    const { data, error } = await admin.auth.admin.createUser(createPayload);

    if (error) {
      if (error.message.includes("already been registered") || error.message.includes("already exists")) {
        return NextResponse.json({ error: "An account with this email/phone already exists. Please sign in instead." }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, userId: data.user.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Signup failed" }, { status: 500 });
  }
}
