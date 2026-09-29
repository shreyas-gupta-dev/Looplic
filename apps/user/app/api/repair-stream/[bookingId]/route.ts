import { NextResponse } from "next/server";

import { getActiveSession } from "@looplic/db/repair-stream";

import { db } from "@/src/lib/db";
import { guardRateLimit } from "@/src/lib/rate-limit";
import { authorizeBookingViewer } from "@/src/lib/repair-stream/authorize";
import { GRANT_TTL_SECONDS, hasGrantSecret, mintGrant } from "@/src/lib/repair-stream/grant";

/**
 * GET /api/repair-stream/[bookingId]?phone=...
 *
 * The security boundary for the repair live view. Issues a short-lived playback
 * grant only when ALL of the following hold:
 *
 *   - the caller has proved a relationship to this booking (signed-in owner, or the
 *     booking's phone number — see lib/repair-stream/authorize.ts);
 *   - a viewing session exists for the booking;
 *   - that session is open;
 *   - that session has not expired.
 *
 * Anything else answers 404 with an identical body, so the endpoint reveals
 * neither which bookings exist nor which of them are currently being worked on.
 * Session state is re-read from the database on every call, so closing a session
 * stops playback immediately rather than when a token happens to expire.
 */
export async function GET(request: Request, context: { params: Promise<{ bookingId: string }> }) {
  // Grants are cheap to mint but this is an authorization endpoint; cap probing.
  const limited = await guardRateLimit(request, "api:repair-stream", 120, 600);
  if (limited) return limited;

  // One response for every denial: not found, not authorized, no session, closed,
  // expired. A caller cannot tell them apart.
  const denied = NextResponse.json({ error: "Not found" }, { status: 404, headers: { "Cache-Control": "no-store" } });

  try {
    const { bookingId } = await context.params;
    const phone = new URL(request.url).searchParams.get("phone");

    if (!hasGrantSecret()) {
      console.error("[repair-stream] no signing secret configured; refusing to issue grants");
      return denied;
    }

    const authorization = await authorizeBookingViewer(bookingId, phone);
    if (!authorization.authorized) return denied;

    const session = await getActiveSession(db as never, authorization.bookingId!);
    if (!session) return denied;

    return NextResponse.json(
      {
        sessionId: session.id,
        provider: session.provider,
        // Consent is reported so the client knows whether to ask; it is not a
        // precondition for the grant itself, because the stage-media provider
        // shows the customer's own device and needs no separate agreement.
        consentRequired: session.provider === "hls" && !session.consentAt,
        consentGiven: Boolean(session.consentAt),
        expiresAt: session.expiresAt.toISOString(),
        grant: mintGrant(session.id, session.bookingId),
        grantTtlSeconds: GRANT_TTL_SECONDS,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[repair-stream] grant request failed:", error);
    return denied;
  }
}
