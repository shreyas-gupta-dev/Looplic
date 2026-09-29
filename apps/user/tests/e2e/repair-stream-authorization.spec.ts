import { readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { closeSession, openSession } from "@looplic/db/repair-stream";
import { bookings, repairStreamSessions } from "@looplic/db/schema";

/**
 * Authorization matrix for GET /api/repair-stream/[bookingId], over real HTTP.
 *
 * The integration spec covers the session helpers; this covers the endpoint that
 * actually decides whether someone gets to watch a repair. Every denial must look
 * identical, so a caller cannot use response differences to learn which bookings
 * exist or which are currently being worked on.
 */

function loadEnv(key: string): string | null {
  try {
    for (const line of readFileSync(join(process.cwd(), ".env.local"), "utf8").split(/\r?\n/)) {
      if (!line || line.startsWith("#") || !line.includes("=")) continue;
      const index = line.indexOf("=");
      if (line.slice(0, index).trim() === key) return line.slice(index + 1).trim();
    }
  } catch {
    return null;
  }
  return null;
}

const databaseUrl = loadEnv("DATABASE_URL");

const OWNER_PHONE = "+919000000301";
const STRANGER_PHONE = "+919000000399";

let pool: Pool;
let db: ReturnType<typeof drizzle>;
const createdBookingIds: string[] = [];

let bookingWithOpenSession = "";
let bookingWithoutSession = "";
let bookingWithClosedSession = "";
let bookingWithExpiredSession = "";

test.beforeAll(async () => {
  test.skip(!databaseUrl, "DATABASE_URL not found in apps/user/.env.local");

  pool = new Pool({ connectionString: databaseUrl!, ssl: { rejectUnauthorized: false }, max: 4 });
  db = drizzle(pool);

  async function createBooking(): Promise<string> {
    const inserted = await db
      .insert(bookings)
      .values({
        customerName: "Stream Route Test",
        customerPhone: OWNER_PHONE,
        serviceType: "mobile_repair",
        status: "in_progress",
        notes: "Created by repair-stream route test",
      })
      .returning({ id: bookings.id });
    createdBookingIds.push(inserted[0].id);
    return inserted[0].id;
  }

  bookingWithOpenSession = await createBooking();
  await openSession(db as never, { bookingId: bookingWithOpenSession, provider: "stage-media" });

  bookingWithoutSession = await createBooking();

  bookingWithClosedSession = await createBooking();
  const closed = await openSession(db as never, { bookingId: bookingWithClosedSession });
  await closeSession(db as never, closed.session!.id);

  bookingWithExpiredSession = await createBooking();
  const expired = await openSession(db as never, { bookingId: bookingWithExpiredSession });
  await db
    .update(repairStreamSessions)
    .set({ expiresAt: new Date(Date.now() - 60_000) })
    .where(eq(repairStreamSessions.id, expired.session!.id));
});

test.afterAll(async () => {
  if (!pool) return;
  for (const id of createdBookingIds) {
    await db.delete(bookings).where(eq(bookings.id, id)).catch(() => undefined);
  }
  await pool.end();
});

async function get(request: any, bookingId: string, phone?: string) {
  const query = phone ? `?phone=${encodeURIComponent(phone)}` : "";
  const response = await request.get(`/api/repair-stream/${bookingId}${query}`, { failOnStatusCode: false });
  let body: any = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  return { status: response.status(), body, headers: response.headers() };
}

test("the owner's phone number gets a grant for an open session", async ({ request }) => {
  const result = await get(request, bookingWithOpenSession, OWNER_PHONE);

  expect(result.status).toBe(200);
  expect(result.body.sessionId).toBeTruthy();
  expect(result.body.provider).toBe("stage-media");
  expect(result.body.grant).toBeTruthy();
  expect(result.body.grantTtlSeconds).toBeGreaterThan(0);
  // Short-lived by design: the session can be closed at any moment.
  expect(result.body.grantTtlSeconds).toBeLessThanOrEqual(300);
  expect(result.headers["cache-control"]).toContain("no-store");
});

test("an anonymous caller with no phone number is refused", async ({ request }) => {
  const result = await get(request, bookingWithOpenSession);
  expect(result.status).toBe(404);
  expect(result.body).toEqual({ error: "Not found" });
});

test("another customer's phone number is refused", async ({ request }) => {
  const result = await get(request, bookingWithOpenSession, STRANGER_PHONE);
  expect(result.status).toBe(404);
  expect(result.body).toEqual({ error: "Not found" });
});

test("a booking with no session is refused even for the owner", async ({ request }) => {
  // Being the customer is not enough: someone has to open a session.
  const result = await get(request, bookingWithoutSession, OWNER_PHONE);
  expect(result.status).toBe(404);
  expect(result.body).toEqual({ error: "Not found" });
});

test("a closed session is refused", async ({ request }) => {
  const result = await get(request, bookingWithClosedSession, OWNER_PHONE);
  expect(result.status).toBe(404);
});

test("an expired session is refused", async ({ request }) => {
  const result = await get(request, bookingWithExpiredSession, OWNER_PHONE);
  expect(result.status).toBe(404);
});

test("closing a session revokes access immediately", async ({ request }) => {
  // Granted...
  expect((await get(request, bookingWithOpenSession, OWNER_PHONE)).status).toBe(200);

  const active = await db
    .select({ id: repairStreamSessions.id })
    .from(repairStreamSessions)
    .where(eq(repairStreamSessions.bookingId, bookingWithOpenSession))
    .limit(1);
  await closeSession(db as never, active[0].id);

  // ...and revoked on the very next request, not when a token expires.
  const afterClose = await get(request, bookingWithOpenSession, OWNER_PHONE);
  expect(afterClose.status).toBe(404);

  // Restore for any later run against the same rows.
  await openSession(db as never, { bookingId: bookingWithOpenSession, provider: "stage-media" });
});

test("every denial is indistinguishable", async ({ request }) => {
  const responses = await Promise.all([
    get(request, bookingWithoutSession, OWNER_PHONE), // real booking, no session
    get(request, bookingWithClosedSession, OWNER_PHONE), // real booking, closed
    get(request, bookingWithOpenSession, STRANGER_PHONE), // real booking, wrong phone
    get(request, "00000000-0000-0000-0000-000000000000", OWNER_PHONE), // no such booking
    get(request, "not-a-uuid", OWNER_PHONE), // malformed id
  ]);

  for (const response of responses) {
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Not found" });
  }
});

test("a malformed booking id is rejected without reaching the database", async ({ request }) => {
  for (const id of ["not-a-uuid", "1", "%20", "../../etc/passwd"]) {
    const result = await get(request, encodeURIComponent(id), OWNER_PHONE);
    expect(result.status, `id: ${id}`).toBe(404);
  }
});

test.describe("media listing requires a valid grant", () => {
  async function getMedia(request: any, bookingId: string, params: Record<string, string>) {
    const query = new URLSearchParams(params).toString();
    const response = await request.get(`/api/repair-stream/${bookingId}/media?${query}`, {
      failOnStatusCode: false,
    });
    let body: any = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    return { status: response.status(), body };
  }

  test("the owner with a fresh grant can list media", async ({ request }) => {
    const grantResponse = await get(request, bookingWithOpenSession, OWNER_PHONE);
    expect(grantResponse.status).toBe(200);

    const media = await getMedia(request, bookingWithOpenSession, {
      phone: OWNER_PHONE,
      grant: grantResponse.body.grant,
    });

    expect(media.status).toBe(200);
    expect(Array.isArray(media.body.items)).toBe(true);
    expect(media.body.sessionId).toBe(grantResponse.body.sessionId);
  });

  test("no S3 URL is ever returned to the client", async ({ request }) => {
    const grantResponse = await get(request, bookingWithOpenSession, OWNER_PHONE);
    const media = await getMedia(request, bookingWithOpenSession, {
      phone: OWNER_PHONE,
      grant: grantResponse.body.grant,
    });

    // Media must be proxied, so the bucket URL and raw object keys stay server-side.
    const serialized = JSON.stringify(media.body);
    expect(serialized).not.toMatch(/amazonaws\.com/);
    expect(serialized).not.toMatch(/objectKey/);
  });

  test("a missing grant is refused", async ({ request }) => {
    const media = await getMedia(request, bookingWithOpenSession, { phone: OWNER_PHONE });
    expect(media.status).toBe(404);
  });

  test("a forged grant is refused", async ({ request }) => {
    const forged = Buffer.from(
      JSON.stringify({ sessionId: "x", bookingId: bookingWithOpenSession, issuedAt: Date.now(), hmac: "00".repeat(32) }),
    ).toString("base64url");

    const media = await getMedia(request, bookingWithOpenSession, { phone: OWNER_PHONE, grant: forged });
    expect(media.status).toBe(404);
  });

  test("a valid grant does not work for another customer's phone", async ({ request }) => {
    const grantResponse = await get(request, bookingWithOpenSession, OWNER_PHONE);

    // Holding a real grant is not enough; the caller must still prove access.
    const media = await getMedia(request, bookingWithOpenSession, {
      phone: STRANGER_PHONE,
      grant: grantResponse.body.grant,
    });
    expect(media.status).toBe(404);
  });

  test("a grant for one booking does not read another's media", async ({ request }) => {
    const grantResponse = await get(request, bookingWithOpenSession, OWNER_PHONE);

    // Same customer phone, different booking with its own (absent) session.
    const media = await getMedia(request, bookingWithoutSession, {
      phone: OWNER_PHONE,
      grant: grantResponse.body.grant,
    });
    expect(media.status).toBe(404);
  });
});
