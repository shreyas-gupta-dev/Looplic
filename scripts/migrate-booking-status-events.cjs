/**
 * Migration: booking_status_events
 *
 * Adds the append-only booking status history table and backfills one event per
 * existing booking so every order has a history from day one.
 *
 * Deliberately NOT run through `drizzle-kit push`: push diffs the entire schema
 * against the live database and will happily propose dropping anything it does not
 * find in schema.ts. This script only ever CREATEs, and is safe to re-run.
 *
 * Usage (from repo root):
 *   node scripts/migrate-booking-status-events.cjs           # apply + backfill
 *   node scripts/migrate-booking-status-events.cjs --verify  # report only, no writes
 *   node scripts/migrate-booking-status-events.cjs --down    # drop the table (asks first)
 *
 * Reads DATABASE_URL from apps/user/.env.local.
 */
const fs = require("node:fs");
const path = require("node:path");
const readline = require("node:readline");
const { Client } = require("pg");

const envPath = path.join(__dirname, "..", "apps", "user", ".env.local");
const env = Object.fromEntries(
  fs.readFileSync(envPath, "utf8").split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

const DATABASE_URL = env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL in apps/user/.env.local");
  process.exit(1);
}

const mode = process.argv.includes("--down")
  ? "down"
  : process.argv.includes("--verify")
    ? "verify"
    : "up";

// Keep in step with packages/db/booking-status.ts. Duplicated here because this
// script is plain CommonJS and the package is ESM TypeScript.
const LEGACY_TO_CANONICAL = {
  pending: "pending",
  new: "pending",
  placed: "pending",
  confirmed: "confirmed",
  scheduled: "confirmed",
  assigned: "pickup_requested",
  pickup_requested: "pickup_requested",
  picked_up: "picked_up",
  collected: "picked_up",
  in_progress: "in_progress",
  repairing: "in_progress",
  ready: "ready",
  repaired: "ready",
  fixed: "ready",
  out_for_delivery: "out_for_delivery",
  dispatched: "out_for_delivery",
  delivered: "delivered",
  returned: "delivered",
  completed: "completed",
  complete: "completed",
  done: "completed",
  closed: "completed",
  on_hold: "on_hold",
  hold: "on_hold",
  paused: "on_hold",
  cancelled: "cancelled",
  canceled: "cancelled",
  rejected: "cancelled",
};

function canonical(status) {
  if (typeof status !== "string") return "pending";
  return LEGACY_TO_CANONICAL[status.trim().toLowerCase().replace(/\s+/g, "_")] || "pending";
}

const CREATE_TABLE = `
CREATE TABLE IF NOT EXISTS booking_status_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  status          text NOT NULL,
  previous_status text,
  note            text,
  actor_id        text,
  actor_role      text NOT NULL DEFAULT 'system',
  created_at      timestamptz NOT NULL DEFAULT now()
);`;

const CREATE_INDEX = `
CREATE INDEX IF NOT EXISTS booking_status_events_booking_created_idx
  ON booking_status_events (booking_id, created_at);`;

async function confirm(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise((resolve) => rl.question(question, resolve));
  rl.close();
  return answer.trim().toLowerCase() === "yes";
}

async function tableExists(pg) {
  const res = await pg.query("SELECT to_regclass('public.booking_status_events') AS reg");
  return res.rows[0].reg !== null;
}

async function report(pg) {
  const exists = await tableExists(pg);
  console.log(`booking_status_events table: ${exists ? "present" : "absent"}`);
  if (!exists) return;

  // Sequential, not Promise.all: a single pg Client cannot run concurrent queries.
  const { rows: [events] } = await pg.query("SELECT count(*)::int AS n FROM booking_status_events");
  const { rows: [bookings] } = await pg.query("SELECT count(*)::int AS n FROM bookings");
  const { rows: [covered] } = await pg.query("SELECT count(DISTINCT booking_id)::int AS n FROM booking_status_events");

  console.log(`bookings: ${bookings.n}`);
  console.log(`status events: ${events.n}`);
  console.log(`bookings with history: ${covered.n} / ${bookings.n}`);

  const distinct = await pg.query(
    "SELECT status, count(*)::int AS n FROM booking_status_events GROUP BY status ORDER BY n DESC",
  );
  if (distinct.rowCount > 0) {
    console.log("event status distribution:");
    for (const row of distinct.rows) console.log(`  ${row.status.padEnd(18)} ${row.n}`);
  }

  const legacy = await pg.query("SELECT status, count(*)::int AS n FROM bookings GROUP BY status ORDER BY n DESC");
  console.log("bookings.status values (and how they map):");
  for (const row of legacy.rows) {
    const mapped = canonical(row.status);
    const flag = mapped === row.status ? "" : `  -> ${mapped}`;
    console.log(`  ${String(row.status).padEnd(18)} ${String(row.n).padEnd(6)}${flag}`);
  }
}

async function up(pg) {
  await pg.query("BEGIN");
  try {
    await pg.query(CREATE_TABLE);
    await pg.query(CREATE_INDEX);
    await pg.query("COMMIT");
  } catch (error) {
    await pg.query("ROLLBACK");
    throw error;
  }
  console.log("✓ booking_status_events table and index in place");

  // Backfill: one seed event per booking that has none. Idempotent by design —
  // the NOT EXISTS clause means re-running adds nothing, so this can be run again
  // after new bookings arrive without duplicating anyone's history.
  const bookingsToSeed = await pg.query(`
    SELECT b.id, b.status, b.created_at, b.assigned_at
    FROM bookings b
    WHERE NOT EXISTS (
      SELECT 1 FROM booking_status_events e WHERE e.booking_id = b.id
    )
  `);

  if (bookingsToSeed.rowCount === 0) {
    console.log("✓ backfill: nothing to do, every booking already has history");
    return;
  }

  let inserted = 0;
  await pg.query("BEGIN");
  try {
    for (const booking of bookingsToSeed.rows) {
      const status = canonical(booking.status);

      // Seed the creation event at the booking's own created_at so the timeline
      // shows the real order date rather than the migration date.
      await pg.query(
        `INSERT INTO booking_status_events (booking_id, status, previous_status, note, actor_role, created_at)
         VALUES ($1, 'pending', NULL, 'Order placed', 'system', $2)`,
        [booking.id, booking.created_at],
      );
      inserted += 1;

      // If the booking has moved beyond pending, record the current status too.
      // assigned_at is the only other timestamp we have, so use it when present
      // and fall back to created_at rather than inventing a time.
      if (status !== "pending") {
        await pg.query(
          `INSERT INTO booking_status_events (booking_id, status, previous_status, note, actor_role, created_at)
           VALUES ($1, $2, 'pending', 'Backfilled from existing booking record', 'system', $3)`,
          [booking.id, status, booking.assigned_at || booking.created_at],
        );
        inserted += 1;
      }
    }
    await pg.query("COMMIT");
  } catch (error) {
    await pg.query("ROLLBACK");
    throw error;
  }

  console.log(`✓ backfill: seeded ${inserted} events across ${bookingsToSeed.rowCount} bookings`);
}

async function down(pg) {
  if (!(await tableExists(pg))) {
    console.log("booking_status_events does not exist; nothing to drop.");
    return;
  }

  const { rows: [{ n }] } = await pg.query("SELECT count(*)::int AS n FROM booking_status_events");
  console.log(`\nAbout to DROP TABLE booking_status_events, destroying ${n} history rows.`);
  console.log("No other table references it, so bookings themselves are unaffected.");

  if (!(await confirm('Type "yes" to confirm: '))) {
    console.log("Aborted. Nothing was changed.");
    return;
  }

  await pg.query("DROP TABLE booking_status_events");
  console.log("✓ dropped booking_status_events");
}

(async () => {
  const pg = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await pg.connect();

  try {
    if (mode === "verify") {
      await report(pg);
    } else if (mode === "down") {
      await down(pg);
    } else {
      await up(pg);
      console.log("");
      await report(pg);
    }
  } finally {
    await pg.end();
  }
})().catch((e) => {
  console.error("MIGRATION FAILED:", e.message);
  process.exit(1);
});
