/**
 * Migration: repair_stream_sessions + repair_stage_media
 *
 * Adds the per-booking repair live-view tables. Additive only — no existing table
 * is touched — and safe to re-run.
 *
 * Deliberately NOT `drizzle-kit push`, which diffs the whole schema against the
 * live database and will propose dropping anything absent from schema.ts.
 *
 * Usage (from repo root):
 *   node scripts/migrate-repair-stream.cjs            # apply
 *   node scripts/migrate-repair-stream.cjs --verify   # report only, no writes
 *   node scripts/migrate-repair-stream.cjs --down     # drop both tables (asks first)
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

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS repair_stream_sessions (
     id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     booking_id   uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
     provider     text NOT NULL DEFAULT 'stage-media',
     provider_ref text,
     state        text NOT NULL DEFAULT 'open',
     opened_by    text,
     opened_at    timestamptz NOT NULL DEFAULT now(),
     expires_at   timestamptz NOT NULL,
     closed_at    timestamptz,
     consent_at   timestamptz,
     created_at   timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS repair_stream_sessions_booking_state_idx
     ON repair_stream_sessions (booking_id, state)`,
  `CREATE TABLE IF NOT EXISTS repair_stage_media (
     id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     session_id       uuid NOT NULL REFERENCES repair_stream_sessions(id) ON DELETE CASCADE,
     booking_id       uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
     stage            text NOT NULL,
     media_type       text NOT NULL DEFAULT 'image',
     object_key       text NOT NULL,
     caption          text,
     captured_by      text,
     captured_by_name text,
     created_at       timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS repair_stage_media_session_created_idx
     ON repair_stage_media (session_id, created_at)`,
];

const TABLES = ["repair_stage_media", "repair_stream_sessions"]; // drop order matters

async function confirm(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise((resolve) => rl.question(question, resolve));
  rl.close();
  return answer.trim().toLowerCase() === "yes";
}

async function exists(pg, table) {
  const res = await pg.query("SELECT to_regclass($1) AS reg", [`public.${table}`]);
  return res.rows[0].reg !== null;
}

async function report(pg) {
  for (const table of ["repair_stream_sessions", "repair_stage_media"]) {
    if (!(await exists(pg, table))) {
      console.log(`${table}: absent`);
      continue;
    }
    const { rows: [{ n }] } = await pg.query(`SELECT count(*)::int AS n FROM ${table}`);
    console.log(`${table}: present (${n} rows)`);
  }

  if (await exists(pg, "repair_stream_sessions")) {
    const { rows } = await pg.query(
      `SELECT state, count(*)::int AS n,
              count(*) FILTER (WHERE expires_at > now())::int AS unexpired
         FROM repair_stream_sessions GROUP BY state ORDER BY n DESC`,
    );
    for (const row of rows) {
      console.log(`  state=${String(row.state).padEnd(8)} ${row.n} (${row.unexpired} not yet expired)`);
    }
  }
}

async function up(pg) {
  await pg.query("BEGIN");
  try {
    for (const statement of STATEMENTS) await pg.query(statement);
    await pg.query("COMMIT");
  } catch (error) {
    await pg.query("ROLLBACK");
    throw error;
  }
  console.log("✓ repair_stream_sessions and repair_stage_media in place");
}

async function down(pg) {
  const present = [];
  for (const table of TABLES) if (await exists(pg, table)) present.push(table);

  if (present.length === 0) {
    console.log("Neither table exists; nothing to drop.");
    return;
  }

  let total = 0;
  for (const table of present) {
    const { rows: [{ n }] } = await pg.query(`SELECT count(*)::int AS n FROM ${table}`);
    total += n;
  }

  console.log(`\nAbout to DROP ${present.join(" and ")}, destroying ${total} rows.`);
  console.log("Bookings are unaffected; only live-view sessions and captured media are removed.");

  if (!(await confirm('Type "yes" to confirm: '))) {
    console.log("Aborted. Nothing was changed.");
    return;
  }

  for (const table of present) {
    await pg.query(`DROP TABLE ${table}`);
    console.log(`✓ dropped ${table}`);
  }
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
