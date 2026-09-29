import crypto from "node:crypto";

import { normalizeIdentifier } from "./admin-users";

// Server-side only — see the note in admin-users.ts for why this is a runtime
// guard rather than the `server-only` package.
if (typeof window !== "undefined") {
  throw new Error("verification-token.ts is server-only and must not be imported by client code");
}

/**
 * Short-lived proof that a caller controls an email address or phone number.
 *
 * Minted by /api/auth/verify-otp after Supabase accepts the OTP, then required
 * by every route that mutates auth state for that identifier (signup,
 * confirm-user). The token is HMAC-signed and carries its own timestamp, so no
 * server-side session store is needed.
 *
 * The signing key is AUTH_OTP_HMAC_SECRET. It deliberately is NOT the Supabase
 * service-role key: reusing a database superuser credential as a signing secret
 * means a token-signing bug becomes a database compromise, and it makes the key
 * impossible to rotate independently. If AUTH_OTP_HMAC_SECRET is absent we fall
 * back to the service-role key so existing deployments keep working, and warn.
 */

const TOKEN_TTL_MS = 10 * 60 * 1000;

let warnedAboutFallback = false;

function getSigningSecret(): string {
  const dedicated = process.env.AUTH_OTP_HMAC_SECRET;
  if (dedicated) return dedicated;

  const fallback = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (fallback && !warnedAboutFallback) {
    warnedAboutFallback = true;
    console.warn(
      "[auth] AUTH_OTP_HMAC_SECRET is not set; falling back to SUPABASE_SERVICE_ROLE_KEY for OTP token signing. Set AUTH_OTP_HMAC_SECRET (see .env.example).",
    );
  }
  return fallback;
}

export function hasVerificationSecret(): boolean {
  return Boolean(getSigningSecret());
}

function sign(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Issues a verification token for an identifier that has just proved ownership.
 */
export function mintVerificationToken(identifier: string): string {
  const secret = getSigningSecret();
  if (!secret) throw new Error("Missing verification signing secret");

  const normalized = normalizeIdentifier(identifier);
  const timestamp = Date.now();
  const hmac = sign(`${normalized}:${timestamp}`, secret);

  return Buffer.from(JSON.stringify({ identifier: normalized, timestamp, hmac })).toString("base64url");
}

export type VerificationCheck =
  | { valid: true; identifier: string }
  | { valid: false; reason: "malformed" | "identifier_mismatch" | "expired" | "bad_signature" | "no_secret" };

/**
 * Validates a token against the identifier it is being used for. Comparison is
 * constant-time and the identifier is re-normalized on both sides so a token
 * minted for "+91 98765 43210" cannot be rejected (or accepted) on formatting
 * alone.
 */
export function verifyVerificationToken(token: string, expectedIdentifier: string): VerificationCheck {
  const secret = getSigningSecret();
  if (!secret) return { valid: false, reason: "no_secret" };

  let decoded: { identifier?: unknown; timestamp?: unknown; hmac?: unknown };
  try {
    decoded = JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
  } catch {
    return { valid: false, reason: "malformed" };
  }

  const identifier = typeof decoded.identifier === "string" ? decoded.identifier : null;
  const timestamp = typeof decoded.timestamp === "number" ? decoded.timestamp : null;
  const hmac = typeof decoded.hmac === "string" ? decoded.hmac : null;

  if (!identifier || !timestamp || !hmac) return { valid: false, reason: "malformed" };

  if (identifier !== normalizeIdentifier(expectedIdentifier)) {
    return { valid: false, reason: "identifier_mismatch" };
  }

  const age = Date.now() - timestamp;
  if (age < 0 || age > TOKEN_TTL_MS) return { valid: false, reason: "expired" };

  const expected = sign(`${identifier}:${timestamp}`, secret);
  const provided = Buffer.from(hmac, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  if (provided.length !== expectedBuffer.length) return { valid: false, reason: "bad_signature" };
  if (!crypto.timingSafeEqual(provided, expectedBuffer)) return { valid: false, reason: "bad_signature" };

  return { valid: true, identifier };
}
