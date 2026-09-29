import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { closeSession, openSession } from "@looplic/db/repair-stream";
import { bookings, repairStreamSessions } from "@looplic/db/schema";

/**
 * Retention for repair footage.
 *
 * Nothing used to delete a session or its media, so both grew without limit and
 * photographs of customers' devices were kept indefinitely. This drives the real
 * script — not a reimplementation of it — against the real database, because the
 * only version worth testing is the one that will actually run from cron.
 *
 * The two properties that matter are symmetric and both are asserted: an old
 * session goes, and a current one does not. A retention job that deletes too much
 * is worse than one that deletes nothing.
 *
 * No S3 media is attached to these sessions, so the script's object-deletion path
 * is not exercised here — that needs working AWS credentials, which this checkout
 * does not have. The row behaviour is what this can prove.
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
const REPO_ROOT = join(process.cwd(), "..", "..");
const SCRIPT = join(REPO_ROOT, "scripts", "repair-stream-retention.cjs");

let pool: Pool;
let db: ReturnType<typeof drizzle>;
const createdBookingIds: string[] = [];

test.beforeAll(() => {
  test.skip(!databaseUrl, "DATABASE_URL not found in apps/user/.env.local");
  pool = new Pool({ connectionString: databaseUrl!, ssl: { rejectUnauthorized: false }, max: 4 });
  db = drizzle(pool);
});

test.afterAll(async () => {
  if (!pool) return;
  for (const id of createdBookingIds) {
    await db.delete(bookings).where(eq(bookings.id, id)).catch(() => undefined);
  }
  await pool.end();
});

async function bookingWithSession(): Promise<{ bookingId: string; sessionId: string }> {
  const inserted = await db
    .insert(bookings)
    .values({
      customerName: "Retention Test Customer",
      customerPhone: "+919000000701",
      serviceType: "mobile_repair",
      status: "in_progress",
      notes: "Created by repair-stream retention test",
    })
    .returning({ id: bookings.id });

  const bookingId = inserted[0].id;
  createdBookingIds.push(bookingId);

  const opened = await openSession(db as never, { bookingId, provider: "stage-media" });
  expect(opened.session).toBeTruthy();
  return { bookingId, sessionId: opened.session!.id };
}

function runRetention(args: string[]): string {
  return execFileSync("node", [SCRIPT, ...args], { cwd: REPO_ROOT, encoding: "utf8" });
}

test("a session closed longer ago than the retention period is deleted", async () => {
  const { sessionId } = await bookingWithSession();
  await closeSession(db as never, sessionId);

  // Backdate the close so it falls outside a 30-day window.
  await db
    .update(repairStreamSessions)
    .set({ closedAt: sql`now() - interval '60 days'` })
    .where(eq(repairStreamSessions.id, sessionId));

  // A dry run must report it and change nothing.
  const dryRun = runRetention([]);
  expect(dryRun).toContain("dry run");
  const stillThere = await db
    .select({ id: repairStreamSessions.id })
    .from(repairStreamSessions)
    .where(eq(repairStreamSessions.id, sessionId));
  expect(stillThere, "dry run must not delete").toHaveLength(1);

  // Applying removes it.
  const applied = runRetention(["--apply"]);
  expect(applied).toContain("Retention pass complete");

  const gone = await db
    .select({ id: repairStreamSessions.id })
    .from(repairStreamSessions)
    .where(eq(repairStreamSessions.id, sessionId));
  expect(gone, "session past retention is deleted").toHaveLength(0);
});

test("a session that is still open is never deleted, however old", async () => {
  const { sessionId } = await bookingWithSession();

  // Opened long ago but never closed and not yet expired: someone could be
  // watching it right now.
  await db
    .update(repairStreamSessions)
    .set({
      openedAt: sql`now() - interval '400 days'`,
      expiresAt: sql`now() + interval '2 hours'`,
    })
    .where(eq(repairStreamSessions.id, sessionId));

  runRetention(["--apply"]);

  const survived = await db
    .select({ id: repairStreamSessions.id })
    .from(repairStreamSessions)
    .where(eq(repairStreamSessions.id, sessionId));
  expect(survived, "an open, unexpired session must survive").toHaveLength(1);
});

test("a recently closed session is kept", async () => {
  const { sessionId } = await bookingWithSession();
  await closeSession(db as never, sessionId);

  runRetention(["--apply"]);

  const survived = await db
    .select({ id: repairStreamSessions.id })
    .from(repairStreamSessions)
    .where(eq(repairStreamSessions.id, sessionId));
  expect(survived, "a session closed today is inside the window").toHaveLength(1);
});

test("the retention period can be shortened, and then it does apply", async () => {
  const { sessionId } = await bookingWithSession();
  await closeSession(db as never, sessionId);

  await db
    .update(repairStreamSessions)
    .set({ closedAt: sql`now() - interval '3 days'` })
    .where(eq(repairStreamSessions.id, sessionId));

  // Outside the default 30 days? No. Outside 2 days? Yes.
  runRetention(["--apply"]);
  const keptAtDefault = await db
    .select({ id: repairStreamSessions.id })
    .from(repairStreamSessions)
    .where(eq(repairStreamSessions.id, sessionId));
  expect(keptAtDefault).toHaveLength(1);

  runRetention(["--apply", "--days=2"]);
  const removedAtTwoDays = await db
    .select({ id: repairStreamSessions.id })
    .from(repairStreamSessions)
    .where(eq(repairStreamSessions.id, sessionId));
  expect(removedAtTwoDays).toHaveLength(0);
});

test("a retention period below one day is refused", () => {
  // Guards against a cron entry with a typo wiping everything.
  expect(() => runRetention(["--apply", "--days=0"])).toThrow();
});
