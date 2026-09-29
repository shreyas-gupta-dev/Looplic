/**
 * Cleanup: remove non-allowlisted image URLs from the catalog.
 *
 * The problem this fixes is at the data layer, not the render layer. Migration
 * populated `image_url` columns from mixed sources, leaving two kinds of URL that
 * Looplic must not serve:
 *
 *   1. `t1.gstatic.com/faviconV2?...` — Google's favicon proxy, written by
 *      scripts/populate-brand-logos.cjs. It 404s for any brand Google has no icon
 *      for, which is how the broken Fujitsu logo reached production.
 *   2. `s3ng.cashify.in/...` — a competitor's own CDN, written by
 *      scripts/scrape-cashify-catalog.cjs. Hotlinking it is a brand and licensing
 *      exposure as well as a reliability one: it can break without warning.
 *
 * The application already refuses to render these (see isRenderableImageUrl in
 * apps/user/src/lib/images/registry.ts), so this script is not what makes the
 * pages correct — it stops the database from being the source of the problem, and
 * means a future component that forgets the guard cannot reintroduce it.
 *
 * Setting the column to NULL is deliberate: every consumer already has a branded
 * fallback for a null image, so null is the accurate representation of "we do not
 * have a logo we are allowed to use".
 *
 * Usage (from repo root):
 *   node scripts/clean-catalog-image-urls.cjs            # dry run, no writes
 *   node scripts/clean-catalog-image-urls.cjs --apply    # perform the update
 *   node scripts/clean-catalog-image-urls.cjs --verify   # assert nothing is left
 */
const fs = require("node:fs");
const path = require("node:path");
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

const mode = process.argv.includes("--apply")
  ? "apply"
  : process.argv.includes("--verify")
    ? "verify"
    : "dry-run";

/**
 * Kept in step with ALLOWED_IMAGE_HOSTS in the image registry. Expressed as a
 * negative match (what is NOT allowed) rather than a list of bad hosts, so a
 * third source nobody has thought of yet is also caught.
 *
 * Relative paths (our own /public assets) and the allowlisted hosts survive.
 */
const ALLOWED_LIKE = [
  "image_url LIKE '/%'",
  "image_url LIKE 'https://looplic-assets.s3.ap-south-1.amazonaws.com/%'",
  "image_url LIKE 'https://looplic-assets.s3.amazonaws.com/%'",
  "image_url LIKE 'https://res.cloudinary.com/%'",
  "image_url ~ '^https://[a-z0-9-]+\\.supabase\\.co/'",
];

const OFFENDING = `image_url IS NOT NULL AND image_url <> '' AND NOT (${ALLOWED_LIKE.join(" OR ")})`;

/** Tables carrying a catalog image_url column. */
const TABLES = ["brands", "series", "models", "sell_categories", "repair_categories", "repair_subcategories"];

async function tableExists(client, table) {
  const { rows } = await client.query(
    `SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1 AND column_name = 'image_url' LIMIT 1`,
    [table],
  );
  return rows.length > 0;
}

async function main() {
  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();

  console.log(`mode: ${mode}\n`);

  let total = 0;
  const perTable = [];

  for (const table of TABLES) {
    if (!(await tableExists(client, table))) {
      console.log(`- ${table}: no image_url column, skipped`);
      continue;
    }

    const { rows } = await client.query(
      `SELECT image_url, count(*)::int AS n FROM ${table}
        WHERE ${OFFENDING} GROUP BY image_url ORDER BY n DESC`,
    );
    const count = rows.reduce((sum, r) => sum + r.n, 0);
    total += count;
    perTable.push({ table, count });

    console.log(`- ${table}: ${count} offending row(s)`);
    // Show a few representative values so the operator can see what will be lost.
    for (const r of rows.slice(0, 3)) {
      console.log(`    ${r.n}x  ${String(r.image_url).slice(0, 110)}`);
    }
    if (rows.length > 3) console.log(`    ... and ${rows.length - 3} more distinct value(s)`);
  }

  console.log(`\ntotal offending rows: ${total}`);

  if (mode === "verify") {
    await client.end();
    if (total > 0) {
      console.error(`\nFAIL: ${total} non-allowlisted image_url value(s) remain.`);
      process.exit(1);
    }
    console.log("\nPASS: no non-allowlisted image_url values remain.");
    return;
  }

  if (mode === "dry-run") {
    console.log("\nDry run — nothing was written. Re-run with --apply to clear these.");
    await client.end();
    return;
  }

  // apply
  if (total === 0) {
    console.log("\nNothing to do.");
    await client.end();
    return;
  }

  await client.query("BEGIN");
  try {
    for (const { table, count } of perTable) {
      if (count === 0) continue;
      const res = await client.query(`UPDATE ${table} SET image_url = NULL WHERE ${OFFENDING}`);
      console.log(`  ${table}: cleared ${res.rowCount} row(s)`);
    }
    await client.query("COMMIT");
    console.log("\nCommitted.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("\nRolled back:", err.message);
    process.exitCode = 1;
  }

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
