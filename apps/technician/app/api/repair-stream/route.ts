import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { and, eq, inArray } from "drizzle-orm";

import {
  addStageMedia,
  buildRepairMediaKey,
  closeSession,
  getActiveSession,
  getSessionById,
  getStageMedia,
  isRepairStage,
  openSession,
  REPAIR_STAGES,
} from "@looplic/db/repair-stream";

import { db } from "@/src/lib/db";
import * as schema from "@/src/lib/db/schema";
import { getServerSession } from "@/src/lib/auth/cognito-server";

/**
 * Staff endpoint for the repair live view.
 *
 * Lets a technician open a viewing window on a booking, capture a photo or short
 * clip against a repair stage, and close the window when the job is done. The
 * customer-facing side lives in apps/user and only ever reads.
 *
 * Every action requires a staff role. A customer session reaching this route gets
 * 403 even though it is a perfectly valid Supabase session.
 */

const REGION = process.env.NEXT_PUBLIC_S3_REGION || process.env.AWS_REGION || "ap-south-1";
const BUCKET = process.env.NEXT_PUBLIC_S3_BUCKET || "looplic-assets";

// 15 MB: enough for a phone photo or a few seconds of video, small enough that a
// mistake cannot fill the bucket.
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

const ALLOWED_MIME = new Map<string, { extension: string; mediaType: "image" | "video" }>([
  ["image/jpeg", { extension: "jpg", mediaType: "image" }],
  ["image/png", { extension: "png", mediaType: "image" }],
  ["image/webp", { extension: "webp", mediaType: "image" }],
  ["video/mp4", { extension: "mp4", mediaType: "video" }],
  ["video/webm", { extension: "webm", mediaType: "video" }],
]);

const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

async function requireStaff() {
  const session = await getServerSession();
  if (!session.user) return { ok: false as const, response: unauthorized() };

  const rows = await db
    .select({ role: schema.userRoles.role })
    .from(schema.userRoles)
    .where(
      and(
        eq(schema.userRoles.userId, session.user.id),
        inArray(schema.userRoles.role, ["admin", "operation", "technician"]),
      ),
    );

  if (rows.length === 0) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: { message: "Only Looplic staff can manage a repair live view." } },
        { status: 403 },
      ),
    };
  }

  return { ok: true as const, userId: session.user.id, name: session.user.name ?? null };
}

function unauthorized() {
  return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
}

function badRequest(message: string) {
  return NextResponse.json({ error: { message } }, { status: 400 });
}

async function getAvailableCentres() {
  try {
    const rows = await db
      .select({ value: schema.appSettings.value })
      .from(schema.appSettings)
      .where(eq(schema.appSettings.key, "repair_stream_centres"))
      .limit(1);

    if (rows.length === 0 || !rows[0].value) return [];
    let parsed: any = rows[0].value;
    if (typeof parsed === "string") {
      try {
        parsed = JSON.parse(parsed);
      } catch {
        return [];
      }
    }
    const centres = parsed?.centres;
    const defaultCentre = parsed?.defaultCentre;
    if (!centres || typeof centres !== "object") return [];

    return Object.entries(centres).map(([key, val]: [string, any]) => ({
      key,
      label: val?.label || key,
      isDefault: key === defaultCentre,
    }));
  } catch {
    return [];
  }
}

/** GET ?bookingId=... — current session plus what has been captured so far and available camera centres. */
export async function GET(request: NextRequest) {
  const staff = await requireStaff();
  if (!staff.ok) return staff.response;

  const bookingId = request.nextUrl.searchParams.get("bookingId");
  if (!bookingId) return badRequest("A bookingId is required.");

  const availableCentres = await getAvailableCentres();
  const session = await getActiveSession(db as never, bookingId);
  if (!session) {
    return NextResponse.json({
      data: {
        session: null,
        media: [],
        stages: REPAIR_STAGES,
        centres: availableCentres,
      },
    });
  }

  const media = await getStageMedia(db as never, session.id);

  return NextResponse.json({
    data: {
      session: {
        id: session.id,
        provider: session.provider,
        providerRef: session.providerRef,
        expiresAt: session.expiresAt.toISOString(),
        consentGiven: Boolean(session.consentAt),
      },
      // Object keys are intentionally omitted: staff UI needs the list and the
      // captions, not a direct route to the bytes.
      media: media.map((item) => ({
        id: item.id,
        stage: item.stage,
        stageLabel: item.stageLabel,
        mediaType: item.mediaType,
        caption: item.caption,
        capturedByName: item.capturedByName,
        createdAt: item.createdAt.toISOString(),
      })),
      stages: REPAIR_STAGES,
      centres: availableCentres,
    },
  });
}

/**
 * POST — three actions, chosen by the `action` field:
 *   open    (JSON)      start or reuse a viewing session
 *   close   (JSON)      end it; playback stops on the customer's next request
 *   capture (multipart) upload one photo/clip against a repair stage
 */
export async function POST(request: NextRequest) {
  const staff = await requireStaff();
  if (!staff.ok) return staff.response;

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    return handleCapture(request, staff.userId, staff.name);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return badRequest("Expected a JSON body or a multipart upload.");
  }

  const action = String(body.action ?? "");
  const bookingId = typeof body.bookingId === "string" ? body.bookingId : "";

  if (action === "open") {
    if (!bookingId) return badRequest("A bookingId is required.");

    const result = await openSession(db as never, {
      bookingId,
      provider: typeof body.provider === "string" ? body.provider : "stage-media",
      providerRef: typeof body.providerRef === "string" ? body.providerRef : null,
      openedBy: staff.userId,
      minutes: typeof body.minutes === "number" ? body.minutes : undefined,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: { message: result.message ?? "Could not open a live view session." } },
        { status: result.status ?? 500 },
      );
    }

    const [bookingRow] = await db
      .select({
        bookingCode: schema.bookings.bookingCode,
        customerPhone: schema.bookings.customerPhone,
        customerName: schema.bookings.customerName,
      })
      .from(schema.bookings)
      .where(eq(schema.bookings.id, bookingId))
      .limit(1);

    const bookingCode = bookingRow?.bookingCode ?? null;
    const customerPhone = bookingRow?.customerPhone ?? null;
    const customerName = bookingRow?.customerName ?? null;
    const watchUrl = bookingCode
      ? `https://looplic.com/track/${encodeURIComponent(bookingCode)}${customerPhone ? `?phone=${encodeURIComponent(customerPhone)}&watch=live` : "?watch=live"}`
      : null;

    return NextResponse.json({
      data: {
        sessionId: result.session!.id,
        provider: result.session!.provider,
        providerRef: result.session!.providerRef,
        expiresAt: result.session!.expiresAt.toISOString(),
        reused: Boolean(result.reused),
        bookingCode,
        customerPhone,
        customerName,
        watchUrl,
      },
    });
  }

  if (action === "close") {
    const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
    if (!sessionId) return badRequest("A sessionId is required to close a session.");

    const closed = await closeSession(db as never, sessionId);
    return NextResponse.json({ data: { closed } });
  }

  return badRequest(`Unknown action: ${action || "(none)"}`);
}

async function handleCapture(request: NextRequest, userId: string, staffName: string | null) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return badRequest("Could not read the upload.");
  }

  const sessionId = String(form.get("sessionId") || "");
  const stage = String(form.get("stage") || "");
  const caption = String(form.get("caption") || "").trim() || null;
  const file = form.get("file");

  if (!sessionId) return badRequest("A sessionId is required.");
  if (!isRepairStage(stage)) return badRequest(`Unknown repair stage: ${stage || "(none)"}`);
  if (!(file instanceof File)) return badRequest("A file is required.");

  if (file.size === 0) return badRequest("The uploaded file is empty.");
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: { message: `Files must be under ${Math.floor(MAX_UPLOAD_BYTES / (1024 * 1024))} MB.` } },
      { status: 413 },
    );
  }

  const allowed = ALLOWED_MIME.get(file.type);
  if (!allowed) {
    return NextResponse.json(
      { error: { message: `Unsupported file type: ${file.type || "unknown"}` } },
      { status: 415 },
    );
  }

  // Check the session before spending an S3 write, and again inside addStageMedia
  // so a session that closes mid-upload cannot have media attached to it.
  const session = await getSessionById(db as never, sessionId);
  if (!session) return NextResponse.json({ error: { message: "Session not found." } }, { status: 404 });
  if (session.state !== "open" || session.expiresAt.getTime() <= Date.now()) {
    return NextResponse.json({ error: { message: "This live view session is no longer open." } }, { status: 409 });
  }

  const key = buildRepairMediaKey({
    bookingId: session.bookingId,
    sessionId: session.id,
    extension: allowed.extension,
    random: randomBytes(16).toString("hex"),
  });

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: Buffer.from(await file.arrayBuffer()),
        ContentType: file.type,
        // Repair media is private to one customer, so it must not be cached by
        // shared caches even though it is served through our own route.
        CacheControl: "private, max-age=0, no-store",
      }),
    );
  } catch (error) {
    console.error("[repair-stream] S3 upload failed:", error);
    return NextResponse.json({ error: { message: "Upload failed. Please try again." } }, { status: 502 });
  }

  const result = await addStageMedia(db as never, {
    sessionId: session.id,
    stage,
    objectKey: key,
    mediaType: allowed.mediaType,
    caption,
    capturedBy: userId,
    capturedByName: staffName,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: { message: result.message ?? "Could not record the capture." } },
      { status: result.status ?? 500 },
    );
  }

  return NextResponse.json({ data: { id: result.id, stage, mediaType: allowed.mediaType } });
}
