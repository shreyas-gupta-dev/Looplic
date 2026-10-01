import { and, asc, desc, eq, gt } from "drizzle-orm";

import { bookings, repairStageMedia, repairStreamSessions } from "./schema";

/**
 * Repair live-view sessions.
 *
 * The rule this module exists to enforce: a customer can watch work on their own
 * booking, only while a session is deliberately open, and only until it expires.
 * Nothing here grants access on its own — the API route is the security boundary —
 * but every query is written so that an accidental omission fails closed rather
 * than open.
 */

type Db = {
  select: (...args: any[]) => any;
  update: (...args: any[]) => any;
  insert: (...args: any[]) => any;
  transaction?: <T>(fn: (tx: any) => Promise<T>) => Promise<T>;
};

/** Delivery mechanisms. See the schema comment on repairStreamSessions. */
export const STREAM_PROVIDERS = ["stage-media", "hls"] as const;
export type StreamProvider = (typeof STREAM_PROVIDERS)[number];

export function isStreamProvider(value: unknown): value is StreamProvider {
  return typeof value === "string" && (STREAM_PROVIDERS as readonly string[]).includes(value);
}

/** Repair stages a technician captures media against, in order. */
export const REPAIR_STAGES = ["received", "diagnosed", "part_replaced", "tested", "closed"] as const;
export type RepairStage = (typeof REPAIR_STAGES)[number];

export const REPAIR_STAGE_LABELS: Record<RepairStage, string> = {
  received: "Device received",
  diagnosed: "Fault diagnosed",
  part_replaced: "Part replaced",
  tested: "Tested",
  closed: "Reassembled and closed",
};

export function isRepairStage(value: unknown): value is RepairStage {
  return typeof value === "string" && (REPAIR_STAGES as readonly string[]).includes(value);
}

/** Default session length. Long enough for a repair, short enough to matter. */
export const DEFAULT_SESSION_MINUTES = 240;
/** Upper bound, so a typo cannot open a session for a year. */
export const MAX_SESSION_MINUTES = 24 * 60;

/** Prefix all repair media shares, so it can be targeted by a bucket policy. */
export const REPAIR_MEDIA_PREFIX = "repair-media";

/**
 * Builds the S3 object key for a captured photo or clip.
 *
 * The 32 hex characters of randomness are load-bearing. The looplic-assets bucket
 * currently has a `PublicReadGetObject` policy on `*`, so any object whose key is
 * known can be fetched directly, bypassing our authorization. Media is only ever
 * served through the grant-checked proxy route and its S3 URL is never returned to
 * a client, but an unguessable key means that even so, nobody can enumerate or
 * guess their way to another customer's repair photos.
 *
 * This is mitigation, not a fix. Proper confidentiality needs the bucket policy
 * narrowed to exclude this prefix, or a separate private bucket — see
 * docs/repair-live-view.md.
 */
export function buildRepairMediaKey(options: {
  bookingId: string;
  sessionId: string;
  extension?: string;
  random: string;
}): string {
  const extension = (options.extension || "webp").replace(/[^a-z0-9]/gi, "").toLowerCase() || "webp";
  return `${REPAIR_MEDIA_PREFIX}/${options.bookingId}/${options.sessionId}/${options.random}.${extension}`;
}

export type RepairStreamSession = {
  id: string;
  bookingId: string;
  provider: StreamProvider;
  providerRef: string | null;
  state: string;
  openedAt: Date;
  expiresAt: Date;
  closedAt: Date | null;
  consentAt: Date | null;
};

function toSession(row: Record<string, any>): RepairStreamSession {
  return {
    id: String(row.id),
    bookingId: String(row.bookingId),
    provider: isStreamProvider(row.provider) ? row.provider : "stage-media",
    providerRef: row.providerRef ?? null,
    state: String(row.state),
    openedAt: row.openedAt instanceof Date ? row.openedAt : new Date(row.openedAt),
    expiresAt: row.expiresAt instanceof Date ? row.expiresAt : new Date(row.expiresAt),
    closedAt: row.closedAt ? (row.closedAt instanceof Date ? row.closedAt : new Date(row.closedAt)) : null,
    consentAt: row.consentAt ? (row.consentAt instanceof Date ? row.consentAt : new Date(row.consentAt)) : null,
  };
}

/**
 * The session a customer may currently watch, or null.
 *
 * "Currently" is enforced in the query itself — state must be open AND expiry must
 * be in the future — so a caller cannot forget one of the two conditions. An
 * expired-but-still-open row is invisible here even though nothing has closed it.
 */
export async function getActiveSession(db: Db, bookingId: string): Promise<RepairStreamSession | null> {
  if (!bookingId) return null;

  const rows = await db
    .select()
    .from(repairStreamSessions)
    .where(
      and(
        eq(repairStreamSessions.bookingId, bookingId),
        eq(repairStreamSessions.state, "open"),
        gt(repairStreamSessions.expiresAt, new Date()),
      ),
    )
    .orderBy(desc(repairStreamSessions.openedAt))
    .limit(1);

  return rows[0] ? toSession(rows[0]) : null;
}

export async function getSessionById(db: Db, sessionId: string): Promise<RepairStreamSession | null> {
  if (!sessionId) return null;

  const rows = await db
    .select()
    .from(repairStreamSessions)
    .where(eq(repairStreamSessions.id, sessionId))
    .limit(1);

  return rows[0] ? toSession(rows[0]) : null;
}

export type OpenSessionResult = {
  ok: boolean;
  status?: number;
  message?: string;
  session?: RepairStreamSession;
  /** True when an already-open session was returned instead of a new one. */
  reused?: boolean;
};

/**
 * Opens a viewing session for a booking, or returns the one already open.
 *
 * Idempotent on purpose: a technician tapping "start live view" twice should not
 * create two sessions, because closing one would leave the other viewable.
 */
export async function openSession(
  db: Db,
  options: {
    bookingId: string;
    provider?: string;
    providerRef?: string | null;
    openedBy?: string | null;
    minutes?: number;
  },
): Promise<OpenSessionResult> {
  const { bookingId } = options;
  if (!bookingId) return { ok: false, status: 400, message: "A booking id is required." };

  const provider = isStreamProvider(options.provider) ? options.provider : "stage-media";

  const requested = typeof options.minutes === "number" && options.minutes > 0
    ? Math.min(options.minutes, MAX_SESSION_MINUTES)
    : DEFAULT_SESSION_MINUTES;

  const bookingRows = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!bookingRows[0]) return { ok: false, status: 404, message: "Booking not found." };

  const existing = await getActiveSession(db, bookingId);
  if (existing) {
    if (
      (options.provider && options.provider !== existing.provider) ||
      (options.providerRef !== undefined && options.providerRef !== existing.providerRef)
    ) {
      const updated = await db
        .update(repairStreamSessions)
        .set({
          provider,
          providerRef: options.providerRef !== undefined ? options.providerRef : existing.providerRef,
        })
        .where(eq(repairStreamSessions.id, existing.id))
        .returning();
      return { ok: true, session: toSession(updated[0]), reused: true };
    }
    return { ok: true, session: existing, reused: true };
  }

  const expiresAt = new Date(Date.now() + requested * 60 * 1000);
  const inserted = await db
    .insert(repairStreamSessions)
    .values({
      bookingId,
      provider,
      providerRef: options.providerRef ?? null,
      state: "open",
      openedBy: options.openedBy ?? null,
      expiresAt,
    })
    .returning();

  return { ok: true, session: toSession(inserted[0]), reused: false };
}

/**
 * Closes a session immediately.
 *
 * Playback must stop at once, which is why the API route re-reads session state on
 * every grant request rather than trusting a previously issued token to remain
 * valid for its full lifetime.
 */
export async function closeSession(db: Db, sessionId: string): Promise<boolean> {
  if (!sessionId) return false;

  const updated = await db
    .update(repairStreamSessions)
    .set({ state: "closed", closedAt: new Date() })
    .where(and(eq(repairStreamSessions.id, sessionId), eq(repairStreamSessions.state, "open")))
    .returning({ id: repairStreamSessions.id });

  return updated.length > 0;
}

/** Records that the customer agreed to view live footage of their repair. */
export async function recordConsent(db: Db, sessionId: string): Promise<boolean> {
  if (!sessionId) return false;

  const updated = await db
    .update(repairStreamSessions)
    .set({ consentAt: new Date() })
    .where(eq(repairStreamSessions.id, sessionId))
    .returning({ id: repairStreamSessions.id });

  return updated.length > 0;
}

export type StageMediaItem = {
  id: string;
  stage: RepairStage;
  stageLabel: string;
  mediaType: string;
  objectKey: string;
  caption: string | null;
  capturedByName: string | null;
  createdAt: Date;
};

/** Media for a session, oldest first — the order a repair happened in. */
export async function getStageMedia(db: Db, sessionId: string): Promise<StageMediaItem[]> {
  if (!sessionId) return [];

  const rows = await db
    .select()
    .from(repairStageMedia)
    .where(eq(repairStageMedia.sessionId, sessionId))
    .orderBy(asc(repairStageMedia.createdAt));

  return (rows as Record<string, any>[]).map((row) => {
    const stage: RepairStage = isRepairStage(row.stage) ? row.stage : "received";
    return {
      id: String(row.id),
      stage,
      stageLabel: REPAIR_STAGE_LABELS[stage],
      mediaType: String(row.mediaType ?? "image"),
      objectKey: String(row.objectKey),
      caption: row.caption ?? null,
      capturedByName: row.capturedByName ?? null,
      createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt),
    };
  });
}

/**
 * One media item, scoped to the session it belongs to.
 *
 * The session id is part of the lookup on purpose: a media id from one repair can
 * never be fetched using a grant for another.
 */
export async function getStageMediaItem(
  db: Db,
  sessionId: string,
  mediaId: string,
): Promise<StageMediaItem | null> {
  if (!sessionId || !mediaId) return null;

  const rows = await db
    .select()
    .from(repairStageMedia)
    .where(and(eq(repairStageMedia.id, mediaId), eq(repairStageMedia.sessionId, sessionId)))
    .limit(1);

  const row = rows[0] as Record<string, any> | undefined;
  if (!row) return null;

  const stage: RepairStage = isRepairStage(row.stage) ? row.stage : "received";
  return {
    id: String(row.id),
    stage,
    stageLabel: REPAIR_STAGE_LABELS[stage],
    mediaType: String(row.mediaType ?? "image"),
    objectKey: String(row.objectKey),
    caption: row.caption ?? null,
    capturedByName: row.capturedByName ?? null,
    createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt),
  };
}

export type AddStageMediaResult = {
  ok: boolean;
  status?: number;
  message?: string;
  id?: string;
};

/**
 * Attaches a captured photo or clip to an open session.
 *
 * Refuses when the session is not currently viewable, so media cannot be added to
 * a closed or expired session and quietly resurface if it is reopened.
 */
export async function addStageMedia(
  db: Db,
  options: {
    sessionId: string;
    stage: string;
    objectKey: string;
    mediaType?: string;
    caption?: string | null;
    capturedBy?: string | null;
    capturedByName?: string | null;
  },
): Promise<AddStageMediaResult> {
  if (!options.sessionId || !options.objectKey) {
    return { ok: false, status: 400, message: "A session id and an uploaded object key are required." };
  }

  if (!isRepairStage(options.stage)) {
    return { ok: false, status: 400, message: `Unknown repair stage: ${String(options.stage)}` };
  }

  const session = await getSessionById(db, options.sessionId);
  if (!session) return { ok: false, status: 404, message: "Session not found." };

  if (session.state !== "open" || session.expiresAt.getTime() <= Date.now()) {
    return { ok: false, status: 409, message: "This live view session is no longer open." };
  }

  const mediaType = options.mediaType === "video" ? "video" : "image";

  const inserted = await db
    .insert(repairStageMedia)
    .values({
      sessionId: session.id,
      bookingId: session.bookingId,
      stage: options.stage,
      mediaType,
      objectKey: options.objectKey,
      caption: options.caption ?? null,
      capturedBy: options.capturedBy ?? null,
      capturedByName: options.capturedByName ?? null,
    })
    .returning({ id: repairStageMedia.id });

  return { ok: true, id: String(inserted[0].id) };
}
