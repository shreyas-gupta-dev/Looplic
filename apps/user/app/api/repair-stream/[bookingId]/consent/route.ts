import { NextResponse } from "next/server";

import { getActiveSession, recordConsent } from "@looplic/db/repair-stream";

import { db } from "@/src/lib/db";
import { guardRateLimit } from "@/src/lib/rate-limit";
import { authorizeBookingViewer } from "@/src/lib/repair-stream/authorize";

/**
 * POST /api/repair-stream/[bookingId]/consent
 *
 * Records that the customer agreed to view live camera footage of their repair.
 *
 * Consent is per session, not per account: a customer who agreed to be shown a
 * camera feed last month has not agreed to this one. The `hls` provider will not
 * play until this has been called for the current session.
 */
export async function POST(request: Request, context: { params: Promise<{ bookingId: string }> }) {
  const limited = await guardRateLimit(request, "api:repair-consent", 30, 600);
  if (limited) return limited;

  const denied = NextResponse.json({ error: "Not found" }, { status: 404, headers: { "Cache-Control": "no-store" } });

  try {
    const { bookingId } = await context.params;

    let phone: string | null = null;
    try {
      const body = await request.json();
      phone = typeof body?.phone === "string" ? body.phone : null;
    } catch {
      phone = new URL(request.url).searchParams.get("phone");
    }

    const authorization = await authorizeBookingViewer(bookingId, phone);
    if (!authorization.authorized) return denied;

    const session = await getActiveSession(db as never, authorization.bookingId!);
    if (!session) return denied;

    const recorded = await recordConsent(db as never, session.id);
    if (!recorded) return denied;

    return NextResponse.json({ consentGiven: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[repair-stream] consent failed:", error);
    return denied;
  }
}
