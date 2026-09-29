import { NextResponse } from "next/server";

import { getActiveSession, getStageMedia } from "@looplic/db/repair-stream";

import { db } from "@/src/lib/db";
import { guardRateLimit } from "@/src/lib/rate-limit";
import { authorizeBookingViewer } from "@/src/lib/repair-stream/authorize";
import { verifyGrant } from "@/src/lib/repair-stream/grant";

/**
 * GET /api/repair-stream/[bookingId]/media?phone=...&grant=...
 *
 * What the customer's live view polls. Lists the photos and clips captured so far,
 * each with a path back through this app — never an S3 URL, so a link cannot
 * outlive the session it belongs to.
 *
 * Requires both a valid grant AND a re-check of viewer authorization and session
 * state. The grant alone is not enough: it is short-lived precisely because
 * everything it asserts is re-verified on each request.
 */
export async function GET(request: Request, context: { params: Promise<{ bookingId: string }> }) {
  const limited = await guardRateLimit(request, "api:repair-media", 240, 600);
  if (limited) return limited;

  const denied = NextResponse.json({ error: "Not found" }, { status: 404, headers: { "Cache-Control": "no-store" } });

  try {
    const { bookingId } = await context.params;
    const url = new URL(request.url);
    const phone = url.searchParams.get("phone");
    const grant = url.searchParams.get("grant");

    if (!grant) return denied;

    const authorization = await authorizeBookingViewer(bookingId, phone);
    if (!authorization.authorized) return denied;

    const session = await getActiveSession(db as never, authorization.bookingId!);
    if (!session) return denied;

    // The grant must be for this exact session, so one repair's grant cannot read
    // another's media.
    const check = verifyGrant(grant, session.id);
    if (!check.valid || check.bookingId !== authorization.bookingId) return denied;

    const media = await getStageMedia(db as never, session.id);

    return NextResponse.json(
      {
        sessionId: session.id,
        provider: session.provider,
        expiresAt: session.expiresAt.toISOString(),
        items: media.map((item) => ({
          id: item.id,
          stage: item.stage,
          stageLabel: item.stageLabel,
          mediaType: item.mediaType,
          caption: item.caption,
          capturedByName: item.capturedByName,
          createdAt: item.createdAt.toISOString(),
          // Proxied through this app. The S3 key never leaves the server.
          url: `/api/repair-stream/${authorization.bookingId}/media/${item.id}?grant=${encodeURIComponent(grant)}${
            phone ? `&phone=${encodeURIComponent(phone)}` : ""
          }`,
        })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[repair-stream] media list failed:", error);
    return denied;
  }
}
