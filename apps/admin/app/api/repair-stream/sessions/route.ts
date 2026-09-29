import { and, desc, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

import { closeSession, isStreamProvider, openSession } from "@looplic/db/repair-stream";

import { db } from "@/src/lib/db";
import { bookings, repairStreamSessions, userRoles } from "@/src/lib/db/schema";
import { getServerSession } from "@/src/lib/auth/cognito-server";

/**
 * Live viewing sessions, for admins.
 *
 * A session is the switch that decides whether a customer can watch work on their
 * device: no open session means nothing is viewable, and closing one stops playback
 * on the customer's very next request rather than whenever a token expires. That
 * makes it an access control, and it belongs behind a deliberate control surface
 * rather than only in the technician's capture dialog.
 *
 * Admin-only, like the centre configuration it names. Technicians open sessions for
 * the booking in front of them through their own dashboard; this is the view across
 * all of them, and the place to revoke one.
 *
 * Deliberately does **not** return `provider_ref` resolved to a playlist URL — the
 * centre key is enough to see which bench a session points at, and the URL itself
 * has exactly one route that serves it.
 *
 *   GET  → { sessions: [...] }  open sessions, newest first
 *   POST → { action: "open", bookingId, provider?, providerRef? }
 *          { action: "close", sessionId }
 */

export const dynamic = "force-dynamic";

/** Flat, not a union on `ok` — see the centres route: strictNullChecks is off. */
type AdminGuard = { ok: boolean; response?: NextResponse };

async function requireAdmin(): Promise<AdminGuard> {
  const session = await getServerSession();
  if (!session.user) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const rows = await db
    .select({ id: userRoles.id })
    .from(userRoles)
    .where(and(eq(userRoles.userId, session.user.id), eq(userRoles.role, "admin")));

  if (rows.length === 0) {
    return { ok: false, response: NextResponse.json({ error: "Admins only" }, { status: 403 }) };
  }

  return { ok: true };
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const rows = await db
    .select({
      id: repairStreamSessions.id,
      bookingId: repairStreamSessions.bookingId,
      provider: repairStreamSessions.provider,
      providerRef: repairStreamSessions.providerRef,
      state: repairStreamSessions.state,
      openedAt: repairStreamSessions.openedAt,
      expiresAt: repairStreamSessions.expiresAt,
      consentAt: repairStreamSessions.consentAt,
      bookingCode: bookings.bookingCode,
      customerName: bookings.customerName,
      bookingStatus: bookings.status,
    })
    .from(repairStreamSessions)
    .leftJoin(bookings, eq(repairStreamSessions.bookingId, bookings.id))
    .where(eq(repairStreamSessions.state, "open"))
    .orderBy(desc(repairStreamSessions.openedAt))
    .limit(100);

  const now = Date.now();
  const sessions = rows.map((row) => ({
    ...row,
    // A session can be `open` and expired at the same time — nothing sweeps the
    // table — so the effective state is what matters to whoever is reading this.
    expired: row.expiresAt ? new Date(row.expiresAt).getTime() <= now : false,
  }));

  return NextResponse.json({ sessions }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  let body: { action?: unknown; bookingId?: unknown; sessionId?: unknown; provider?: unknown; providerRef?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.action === "close") {
    if (typeof body.sessionId !== "string" || !body.sessionId) {
      return NextResponse.json({ error: "A session id is required." }, { status: 400 });
    }
    const closed = await closeSession(db as never, body.sessionId);
    return closed
      ? NextResponse.json({ ok: true })
      : NextResponse.json({ error: "No such open session." }, { status: 404 });
  }

  if (body.action === "open") {
    if (typeof body.bookingId !== "string" || !body.bookingId) {
      return NextResponse.json({ error: "A booking id is required." }, { status: 400 });
    }

    const provider = isStreamProvider(body.provider) ? body.provider : "stage-media";
    const providerRef = typeof body.providerRef === "string" && body.providerRef.trim() ? body.providerRef.trim() : null;

    if (provider === "hls" && !providerRef) {
      return NextResponse.json(
        { error: "A live camera session needs a service centre. Pick one, or use stage media." },
        { status: 400 },
      );
    }

    const result = await openSession(db as never, { bookingId: body.bookingId, provider, providerRef });
    if (!result.session) {
      return NextResponse.json(
        { error: result.message ?? "Could not open a session." },
        { status: result.status ?? 400 },
      );
    }

    return NextResponse.json({ ok: true, session: result.session });
  }

  return NextResponse.json({ error: 'action must be "open" or "close".' }, { status: 400 });
}

/**
 * Bookings worth offering in the "open a session" picker: the ones actually being
 * worked on. Listing every booking ever made would make the control unusable.
 */
export async function PATCH() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const rows = await db
    .select({
      id: bookings.id,
      bookingCode: bookings.bookingCode,
      customerName: bookings.customerName,
      status: bookings.status,
      serviceType: bookings.serviceType,
    })
    .from(bookings)
    .where(inArray(bookings.status, ["picked_up", "in_progress", "ready"]))
    .orderBy(desc(bookings.createdAt))
    .limit(50);

  return NextResponse.json({ bookings: rows }, { headers: { "Cache-Control": "no-store" } });
}
