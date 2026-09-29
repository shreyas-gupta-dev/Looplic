import crypto from "node:crypto";

// Server-side only. See the note in src/lib/auth/admin-users.ts for why this is a
// runtime guard rather than the `server-only` package.
if (typeof window !== "undefined") {
  throw new Error("grant.ts is server-only and must not be imported by client code");
}

/**
 * Short-lived playback grants for the repair live view.
 *
 * A grant is proof that, at the moment it was issued, the holder was authorised to
 * watch one specific session. It is deliberately very short-lived: the session it
 * belongs to can be closed at any time, and a long-lived token would keep working
 * after that. Playback therefore re-requests a grant continuously, and every
 * request re-checks session state in the database — the token is a per-request
 * capability, not a session substitute.
 */

/** Two minutes: long enough to fetch media, short enough that a leak expires. */
const GRANT_TTL_MS = 2 * 60 * 1000;

let warnedAboutFallback = false;

function getSigningSecret(): string {
  const dedicated = process.env.REPAIR_STREAM_GRANT_SECRET;
  if (dedicated) return dedicated;

  // Falling back keeps a deployment that has not set the new variable working,
  // but the two capabilities should not share a key long-term.
  const shared = process.env.AUTH_OTP_HMAC_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (shared && !warnedAboutFallback) {
    warnedAboutFallback = true;
    console.warn(
      "[repair-stream] REPAIR_STREAM_GRANT_SECRET is not set; falling back to a shared secret. Set it (see .env.example).",
    );
  }
  return shared;
}

export function hasGrantSecret(): boolean {
  return Boolean(getSigningSecret());
}

export type GrantPayload = {
  /** Session the grant is for. A grant is never valid for another session. */
  sessionId: string;
  /** Booking the session belongs to, so a grant cannot be replayed across bookings. */
  bookingId: string;
  issuedAt: number;
};

function sign(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

function canonical(payload: GrantPayload): string {
  return `${payload.sessionId}:${payload.bookingId}:${payload.issuedAt}`;
}

export function mintGrant(sessionId: string, bookingId: string): string {
  const secret = getSigningSecret();
  if (!secret) throw new Error("Missing repair stream grant secret");

  const payload: GrantPayload = { sessionId, bookingId, issuedAt: Date.now() };
  const hmac = sign(canonical(payload), secret);

  return Buffer.from(JSON.stringify({ ...payload, hmac })).toString("base64url");
}

export type GrantCheck = {
  valid: boolean;
  reason?: "malformed" | "expired" | "bad_signature" | "no_secret" | "session_mismatch";
  sessionId?: string;
  bookingId?: string;
};

/**
 * Verifies a grant. When `expectedSessionId` is supplied the grant must be for
 * exactly that session, which stops a valid grant for one repair being replayed
 * against another.
 */
export function verifyGrant(token: string, expectedSessionId?: string): GrantCheck {
  const secret = getSigningSecret();
  if (!secret) return { valid: false, reason: "no_secret" };

  let decoded: Record<string, unknown>;
  try {
    decoded = JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
  } catch {
    return { valid: false, reason: "malformed" };
  }

  const sessionId = typeof decoded.sessionId === "string" ? decoded.sessionId : null;
  const bookingId = typeof decoded.bookingId === "string" ? decoded.bookingId : null;
  const issuedAt = typeof decoded.issuedAt === "number" ? decoded.issuedAt : null;
  const hmac = typeof decoded.hmac === "string" ? decoded.hmac : null;

  if (!sessionId || !bookingId || !issuedAt || !hmac) return { valid: false, reason: "malformed" };

  const age = Date.now() - issuedAt;
  if (age < 0 || age > GRANT_TTL_MS) return { valid: false, reason: "expired" };

  const expected = sign(canonical({ sessionId, bookingId, issuedAt }), secret);
  const provided = Buffer.from(hmac, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  if (provided.length !== expectedBuffer.length) return { valid: false, reason: "bad_signature" };
  if (!crypto.timingSafeEqual(provided, expectedBuffer)) return { valid: false, reason: "bad_signature" };

  if (expectedSessionId && sessionId !== expectedSessionId) {
    return { valid: false, reason: "session_mismatch" };
  }

  return { valid: true, sessionId, bookingId };
}

export const GRANT_TTL_SECONDS = GRANT_TTL_MS / 1000;
