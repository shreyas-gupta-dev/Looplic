import { NextResponse } from "next/server";

import { normalizeIdentifier } from "@/src/lib/auth/admin-users";
import { appUrl } from "@/src/lib/auth/config";
import { guardRateLimit } from "@/src/lib/rate-limit";
import { getAdminSupabase, hasServiceRole } from "@/src/lib/supabase/server";

/**
 * POST /api/auth/request-password-reset
 *
 * Sends a password reset link.
 *
 * Runs server-side rather than straight from the browser for three reasons:
 *  - the response can be made uniform, so the form cannot be used to discover
 *    which addresses have accounts;
 *  - provider-side failures (SMTP misconfigured, Supabase's own per-address
 *    throttle) get logged for us instead of shown to the customer as a scary
 *    error that also happens to be an information leak;
 *  - it can be rate limited per IP.
 */
export async function POST(request: Request) {
  const limited = await guardRateLimit(request, "auth:request-password-reset", 5, 15 * 60);
  if (limited) return limited;

  // Always the same answer, whatever happens below.
  const uniformOk = NextResponse.json({ success: true });

  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = normalizeIdentifier(email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      // Malformed input is a client mistake, not an account fact, so it is safe
      // to report.
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    if (!hasServiceRole) {
      console.error("[auth] password reset requested but SUPABASE_SERVICE_ROLE_KEY is missing");
      return uniformOk;
    }

    const origin = resolveOrigin(request);
    // Through /auth/callback so the PKCE code in the emailed link is exchanged
    // for a session before the reset page renders.
    const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent("/auth/reset-password")}`;

    const admin = getAdminSupabase();
    const { error } = await admin.auth.resetPasswordForEmail(normalizedEmail, { redirectTo });

    if (error) {
      console.error("[auth] resetPasswordForEmail failed:", error.message);
    }

    return uniformOk;
  } catch (err: unknown) {
    console.error("[auth] password reset request threw:", err);
    return uniformOk;
  }
}

/**
 * Behind Amplify/CloudFront/Vercel the request origin is an internal localhost, so the
 * public host has to come from Origin, x-forwarded-host or the configured app URL —
 * otherwise reset links point at localhost.
 */
function resolveOrigin(request: Request): string {
  const headerOrigin = request.headers.get("origin");
  if (headerOrigin && !headerOrigin.includes("localhost") && !headerOrigin.includes("127.0.0.1")) {
    return headerOrigin;
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) {
    const proto = request.headers.get("x-forwarded-proto") ?? "https";
    return `${proto}://${forwardedHost}`;
  }

  const url = new URL(request.url);
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
    return url.origin;
  }

  return appUrl;
}
