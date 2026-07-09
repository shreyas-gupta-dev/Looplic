// Overwrites the PLACEHOLDER storage-variant prices produced by
// scripts/seed-buyback-storage-variants.cjs (which scaled +12% per tier — a
// fake number) with real, specific prices.
//
// Two modes:
//
//   --flatten
//       Sets every active variant's base_price equal to its model's flat
//       buyback_model_prices.base_price, so all storage tiers of a model show
//       the SAME price. Use this to remove the misleading fake per-tier
//       scaling until you have real per-storage numbers.
//
//   --file <path>   (default: scripts/variant-prices.json)
//       Applies specific prices from a JSON sheet. Each entry sets the EXACT
//       base_price for one (model, variant_label) — no scaling, no guessing.
//       Sheet format (see scripts/variant-prices.example.json):
//         [
//           { "brand": "Apple", "model": "iPhone 17 Pro",
//             "variants": { "256 GB": 92000, "512 GB": 105000, "1 TB": 118000 } }
//         ]
//       Only mobile models are matched (b.service_type = 'mobile'). Model and
//       brand names are matched case-insensitively. Missing (model, variant)
//       pairs are reported and skipped — nothing else is touched.
//
// Both modes are idempotent and safe to re-run. Neither creates variant rows;
// run seed-buyback-storage-variants.cjs first if a model has none yet.
//
// Usage:
//   DATABASE_URL=postgresql://user:pass@host:5432/looplic node scripts/set-buyback-variant-prices.cjs --flatten
//   DATABASE_URL=postgresql://user:pass@host:5432/looplic node scripts/set-buyback-variant-prices.cjs --file scripts/variant-prices.json
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const DB = process.env.DATABASE_URL;
if (!DB) {
  console.error("Set DATABASE_URL to the RDS connection string before running.");
  process.exit(1);
}

function parseArgs(argv) {
  const args = { flatten: false, file: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--flatten") args.flatten = true;
    else if (argv[i] === "--file") args.file = argv[++i];
  }
  return args;
}

function normLabel(s) {
  // "256gb", "256 GB", "256  gb" → "256 GB" so the sheet is forgiving.
  return String(s).trim().toUpperCase().replace(/\s+/g, " ").replace(/^(\d+)\s*(GB|TB)$/, "$1 $2");
}

async function flatten(client) {
  // Every active mobile variant's price := its model's flat base price.
  const res = await client.query(`
    UPDATE buyback_model_variants v
    SET base_price = p.base_price
    FROM buyback_model_prices p, models m, series s, brands b
    WHERE v.model_id = p.model_id
      AND m.id = v.model_id
      AND s.id = m.series_id
      AND b.id = s.brand_id
      AND b.service_type = 'mobile'
      AND v.active = TRUE
      AND v.base_price IS DISTINCT FROM p.base_price
  `);
  console.log(`Flattened ${res.rowCount} variant row(s) to their model's base price.`);
}

async function applySheet(client, file) {
  const abs = path.resolve(file);
  if (!fs.existsSync(abs)) {
    console.error(`Price sheet not found: ${abs}`);
    console.error("Create one from scripts/variant-prices.example.json, or run with --flatten.");
    process.exit(1);
  }
  const sheet = JSON.parse(fs.readFileSync(abs, "utf8"));
  if (!Array.isArray(sheet)) { console.error("Sheet must be a JSON array."); process.exit(1); }

  let updated = 0;
  const misses = [];
  for (const entry of sheet) {
    const brand = String(entry.brand || "").trim();
    const model = String(entry.model || "").trim();
    const variants = entry.variants || {};
    if (!brand || !model) { console.warn("Skipping entry with no brand/model:", JSON.stringify(entry)); continue; }

    for (const [rawLabel, rawPrice] of Object.entries(variants)) {
      const label = normLabel(rawLabel);
      const price = Number(rawPrice);
      if (!Number.isFinite(price) || price <= 0) {
        console.warn(`Skipping ${brand} ${model} ${label}: invalid price ${rawPrice}`);
        continue;
      }
      const res = await client.query(
        `UPDATE buyback_model_variants v
         SET base_price = $1
         FROM models m, series s, brands b
         WHERE v.model_id = m.id
           AND s.id = m.series_id
           AND b.id = s.brand_id
           AND b.service_type = 'mobile'
           AND lower(b.name) = lower($2)
           AND lower(m.name) = lower($3)
           AND upper(regexp_replace(v.variant_label, '\\s+', ' ', 'g')) = $4`,
        [price, brand, model, label],
      );
      if (res.rowCount > 0) updated += res.rowCount;
      else misses.push(`${brand} / ${model} / ${label}`);
    }
  }

  console.log(`Applied specific prices to ${updated} variant row(s).`);
  if (misses.length) {
    console.log(`\n${misses.length} (model, variant) pair(s) had no matching variant row — check the name/label or seed variants first:`);
    for (const m of misses) console.log(`  · ${m}`);
  }
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  const client = new Client({ connectionString: DB, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    if (args.flatten) {
      await flatten(client);
    } else {
      await applySheet(client, args.file || "scripts/variant-prices.json");
    }
  } finally {
    await client.end();
  }
}

run().catch((e) => { console.error(e); process.exit(1); });
