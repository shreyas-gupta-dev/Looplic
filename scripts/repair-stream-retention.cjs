#!/usr/bin/env node
/**
 * Deletes repair viewing sessions, and the footage attached to them, once they are
 * older than the retention period.
 *
 * ── Why this exists ───────────────────────────────────────────────────────────
 *
 * Nothing deleted anything. `repair_stream_sessions` and `repair_stage_media` grew
 * without limit, and every S3 object written by a technician stayed there
 * indefinitely. Photographs of customers' devices — sometimes with a lock screen,
 * a serial number or a repair invoice in frame — are personal data. Keeping them
 * forever is a liability that grows on its own, and "we do not know how long we
 * keep it" is not an answer a customer or a regulator accepts.
 *
 * The rows cascade on booking delete, so deleting a booking already removed its
 * footage rows — but not the S3 objects, which have no foreign key to cascade
 * through. This handles both.
 *
 * ── The period ────────────────────────────────────────────────────────────────
 *
 * 30 days by default, counted from when the session closed or expired — not from
 * when it opened, so a long repair is not cut short. That number is a starting
 * point, not a legal opinion: it is long enough to settle a "you damaged my phone"
 * dispute, and short enough that the store of personal data stays small. Looplic
 * should confirm it against whatever warranty and dispute window it actually
 * offers, and set REPAIR_MEDIA_RETENTION_DAYS accordingly.
 *
 * ── Usage ─────────────────────────────────────────────────────────────────────
 *
 *   node scripts/repair-stream-retention.cjs            # report only, changes nothing
 *   node scripts/repair-stream-retention.cjs --apply    # delete
 *   node scripts/repair-stream-retention.cjs --days=90  # override the period
 *
 * Dry run by default, deliberately: the destructive direction should be the one you
 * have to ask for. Intended to run daily from cron or a scheduled task.
 */

const { readFileSync } = require("node:fs");
const { join } = require("node:path");

const { Pool } = require("pg");
const { S3Client, DeleteObjectsCommand } = require("@aws-sdk/client-s3");

const REPO_ROOT = join(__dirname, "..");
const DEFAULT_RETENTION_DAYS = 30;

function loadEnvFile(path) {
  const values = {};
  try {
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      if (!line || line.trimStart().startsWith("#") || !line.includes("=")) continue;
      const index = line.indexOf("=");
      values[line.slice(0, index).trim()] = line.slice(index + 1).trim();
    }
  } catch {
    /* absent file is fine */
  }
  return values;
}

const env = {
  ...loadEnvFile(join(REPO_ROOT, ".env.local")),
  ...loadEnvFile(join(REPO_ROOT, "apps", "user", ".env.local")),
  ...process.env,
};

const apply = process.argv.includes("--apply");
const daysFlag = process.argv.find((arg) => arg.startsWith("--days="));
const retentionDays = Number(
  daysFlag ? daysFlag.slice("--days=".length) : env.REPAIR_MEDIA_RETENTION_DAYS || DEFAULT_RETENTION_DAYS,
);

if (!Number.isFinite(retentionDays) || retentionDays < 1) {
  console.error(`Retention must be at least 1 day; got ${retentionDays}.`);
  process.exit(2);
}

const databaseUrl = env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL not found in .env.local, apps/user/.env.local or the environment.");
  process.exit(2);
}

const BUCKET = env.NEXT_PUBLIC_S3_BUCKET || "looplic-assets";
const REGION = env.AWS_REGION || "ap-south-1";

function s3Client() {
  const accessKeyId = env.APP_AWS_ACCESS_KEY_ID || env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = env.APP_AWS_SECRET_ACCESS_KEY || env.AWS_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) return null;
  return new S3Client({ region: REGION, credentials: { accessKeyId, secretAccessKey } });
}

/** S3 accepts at most 1000 keys per delete call. */
function chunk(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

async function main() {
  const pool = new Pool({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false }, max: 4 });
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  console.log(`Retention: ${retentionDays} days (cutoff ${cutoff.toISOString()})`);
  console.log(`Mode: ${apply ? "APPLY — rows and objects will be deleted" : "dry run — nothing will change"}\n`);

  try {
    // Sessions past retention: closed or expired before the cutoff. An open,
    // unexpired session is never touched however old it is, because someone may be
    // watching it right now.
    const { rows: expiredSessions } = await pool.query(
      `SELECT s.id, s.booking_id, s.state, s.closed_at, s.expires_at, b.booking_code
         FROM repair_stream_sessions s
         LEFT JOIN bookings b ON b.id = s.booking_id
        WHERE COALESCE(s.closed_at, s.expires_at) < $1
        ORDER BY COALESCE(s.closed_at, s.expires_at) ASC`,
      [cutoff],
    );

    if (expiredSessions.length === 0) {
      console.log("Nothing past retention.");
      return;
    }

    const sessionIds = expiredSessions.map((row) => row.id);

    const { rows: media } = await pool.query(
      `SELECT id, session_id, object_key FROM repair_stage_media WHERE session_id = ANY($1::uuid[])`,
      [sessionIds],
    );

    console.log(`${expiredSessions.length} session(s) past retention, holding ${media.length} media object(s).`);
    for (const session of expiredSessions.slice(0, 10)) {
      const when = session.closed_at ?? session.expires_at;
      console.log(
        `  ${session.booking_code ?? session.booking_id} — ${session.state}, ended ${new Date(when).toISOString()}`,
      );
    }
    if (expiredSessions.length > 10) console.log(`  … and ${expiredSessions.length - 10} more`);

    if (!apply) {
      console.log("\nDry run. Re-run with --apply to delete.");
      return;
    }

    // S3 first. A row with no object is a harmless orphan; an object with no row is
    // invisible to the application and would never be cleaned up — so the
    // unreferenced-object direction is the one to avoid.
    const keys = media.map((row) => row.object_key).filter(Boolean);
    if (keys.length > 0) {
      const client = s3Client();
      if (!client) {
        console.error(
          "AWS credentials not found, so media objects cannot be deleted.\n" +
            "Refusing to delete the rows that point at them — that would orphan the objects\n" +
            "in S3 with nothing left to find them by. Set AWS_ACCESS_KEY_ID and\n" +
            "AWS_SECRET_ACCESS_KEY and run again.",
        );
        process.exit(1);
      }

      let deleted = 0;
      for (const batch of chunk(keys, 1000)) {
        const result = await client.send(
          new DeleteObjectsCommand({
            Bucket: BUCKET,
            Delete: { Objects: batch.map((Key) => ({ Key })), Quiet: true },
          }),
        );
        deleted += batch.length - (result.Errors?.length ?? 0);
        for (const error of result.Errors ?? []) {
          console.error(`  S3 delete failed for ${error.Key}: ${error.Message}`);
        }
      }
      console.log(`Deleted ${deleted}/${keys.length} object(s) from s3://${BUCKET}`);
    }

    // Then the rows. repair_stage_media cascades from the session, so deleting the
    // sessions is enough.
    const { rowCount } = await pool.query(`DELETE FROM repair_stream_sessions WHERE id = ANY($1::uuid[])`, [
      sessionIds,
    ]);
    console.log(`Deleted ${rowCount} session row(s), cascading their media rows.`);
    console.log("\n✓ Retention pass complete.");
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(`${error.name ?? "Error"}: ${error.message}`);
  process.exit(1);
});
