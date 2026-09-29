import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

import { getActiveSession, getStageMediaItem } from "@looplic/db/repair-stream";

import { db } from "@/src/lib/db";
import { guardRateLimit } from "@/src/lib/rate-limit";
import { authorizeBookingViewer } from "@/src/lib/repair-stream/authorize";
import { verifyGrant } from "@/src/lib/repair-stream/grant";

/**
 * GET /api/repair-stream/[bookingId]/media/[mediaId]?phone=...&grant=...
 *
 * Streams one captured photo or clip.
 *
 * The bytes are proxied from S3 rather than redirecting to it, so the object URL is
 * never disclosed and access dies with the session instead of living as long as the
 * object does. Authorization, session state and grant are all re-checked here — this
 * route is reachable directly, so it cannot rely on the listing route's checks.
 */

const REGION = process.env.NEXT_PUBLIC_S3_REGION || process.env.AWS_REGION || "ap-south-1";
const BUCKET = process.env.NEXT_PUBLIC_S3_BUCKET || "looplic-assets";

const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  mp4: "video/mp4",
  webm: "video/webm",
};

function contentTypeFor(objectKey: string): string {
  const extension = objectKey.split(".").pop()?.toLowerCase() ?? "";
  return CONTENT_TYPES[extension] ?? "application/octet-stream";
}

export async function GET(
  request: Request,
  context: { params: Promise<{ bookingId: string; mediaId: string }> },
) {
  const limited = await guardRateLimit(request, "api:repair-media-object", 600, 600);
  if (limited) return limited;

  const denied = new NextResponse("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

  try {
    const { bookingId, mediaId } = await context.params;
    const url = new URL(request.url);
    const phone = url.searchParams.get("phone");
    const grant = url.searchParams.get("grant");

    if (!grant || !mediaId) return denied;

    const authorization = await authorizeBookingViewer(bookingId, phone);
    if (!authorization.authorized) return denied;

    const session = await getActiveSession(db as never, authorization.bookingId!);
    if (!session) return denied;

    const check = verifyGrant(grant, session.id);
    if (!check.valid || check.bookingId !== authorization.bookingId) return denied;

    // Looked up by session as well as id, so a media id from another repair cannot
    // be fetched with a valid grant for this one.
    const item = await getStageMediaItem(db as never, session.id, mediaId);
    if (!item) return denied;

    const object = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: item.objectKey }));
    if (!object.Body) return denied;

    return new NextResponse(object.Body.transformToWebStream(), {
      headers: {
        "Content-Type": contentTypeFor(item.objectKey),
        // Private to one customer and only valid while the session is open.
        "Cache-Control": "private, no-store, max-age=0",
        "Content-Disposition": "inline",
        // Belt and braces: never let this render as active content.
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[repair-stream] media fetch failed:", error);
    return denied;
  }
}
