// Seeds storage variants (buyback_model_variants) for every MOBILE model that
// doesn't have any yet, so the sell flow shows "Choose a variant" with a
// per-storage price instead of one flat price. Models that already have
// variant rows (e.g. entered by hand in Admin → Buyback) are left untouched,
// and ON CONFLICT (model_id, variant_label) DO NOTHING makes re-runs safe.
//
// Storage tiers come from the model name (iPhone generations get their real
// launch configurations; Android models get tiers based on their class), and
// each variant's price scales up from the model's existing base price in
// buyback_model_prices (lowest tier = base price, +12% per step, rounded to
// the nearest ₹500). These are PLACEHOLDERS like the sample base prices —
// replace them model-by-model from Admin → Buyback whenever real dealer
// prices are ready.
//
// Usage: DATABASE_URL=postgresql://user:pass@host:5432/looplic node scripts/seed-buyback-storage-variants.cjs
const { Client } = require("pg");

const DB = process.env.DATABASE_URL;
if (!DB) {
  console.error("Set DATABASE_URL to the RDS connection string before running.");
  process.exit(1);
}

const STEP_MULTIPLIER = 1.12; // each storage tier up is worth ~12% more

// ── Storage tiers per model ─────────────────────────────────────────────────

function iphoneTiers(name) {
  const n = name.toLowerCase();
  const gen = (() => {
    const m = n.match(/iphone\s*(\d+)/);
    return m ? parseInt(m[1], 10) : null;
  })();

  if (/\bair\b/.test(n)) return ["256 GB", "512 GB", "1 TB"];
  if (/\bse\b/.test(n)) return ["64 GB", "128 GB", "256 GB"];
  if (/\b(x|xs|xr|6|6s|7|8)\b/.test(n) && gen === null) return ["64 GB", "128 GB", "256 GB"];
  if (gen === null) return ["64 GB", "128 GB"];

  const isProMax = /pro\s*max/.test(n);
  const isPro = /\bpro\b/.test(n);

  if (gen >= 17) {
    if (isProMax) return ["256 GB", "512 GB", "1 TB", "2 TB"];
    if (isPro) return ["256 GB", "512 GB", "1 TB"];
    return ["256 GB", "512 GB"];
  }
  if (gen >= 15) {
    if (isProMax) return ["256 GB", "512 GB", "1 TB"];
    if (isPro) return ["128 GB", "256 GB", "512 GB", "1 TB"];
    return ["128 GB", "256 GB", "512 GB"];
  }
  if (gen >= 13) {
    if (isPro) return ["128 GB", "256 GB", "512 GB", "1 TB"];
    if (/\bmini\b/.test(n)) return ["128 GB", "256 GB", "512 GB"];
    return ["128 GB", "256 GB", "512 GB"];
  }
  if (gen >= 12) return ["64 GB", "128 GB", "256 GB"];
  return ["64 GB", "128 GB", "256 GB"];
}

function androidTiers(name) {
  const n = name.toLowerCase();
  // Explicit storage in the model name (e.g. "Galaxy A15 (128 GB)") — the
  // model IS a single variant already, keep one matching row.
  const explicit = n.match(/(\d+)\s*(gb|tb)/);
  if (explicit) {
    const label = `${explicit[1]} ${explicit[2].toUpperCase()}`;
    return [label];
  }
  if (/ultra|fold|pro\s*max/.test(n)) return ["256 GB", "512 GB", "1 TB"];
  if (/\bflip\b/.test(n)) return ["256 GB", "512 GB"];
  if (/\bpro\b|\bplus\b|\+/.test(n)) return ["128 GB", "256 GB", "512 GB"];
  if (/\blite\b|\bgo\b|\bse\b|\bfe\b|\bmini\b/.test(n)) return ["64 GB", "128 GB"];
  return ["128 GB", "256 GB"];
}

function tiersFor(brandName, modelName) {
  return /apple/i.test(brandName) ? iphoneTiers(modelName) : androidTiers(modelName);
}

function roundTo500(v) {
  return Math.max(500, Math.round(v / 500) * 500);
}

async function run() {
  const client = new Client({ connectionString: DB, ssl: { rejectUnauthorized: false } });
  await client.connect();

  // Mobile models with a base price but no variant rows yet.
  const { rows } = await client.query(`
    SELECT m.id, m.name AS model_name, b.name AS brand_name, p.base_price
    FROM models m
    JOIN series s ON s.id = m.series_id
    JOIN brands b ON b.id = s.brand_id
    JOIN buyback_model_prices p ON p.model_id = m.id
    WHERE b.service_type = 'mobile'
      AND NOT EXISTS (SELECT 1 FROM buyback_model_variants v WHERE v.model_id = m.id)
    ORDER BY b.name, m.name
  `);
  console.log(`${rows.length} mobile model(s) without storage variants.`);

  let inserted = 0;
  for (const row of rows) {
    const tiers = tiersFor(row.brand_name, row.model_name);
    const base = Number(row.base_price);
    if (!Number.isFinite(base) || base <= 0) continue;

    for (let i = 0; i < tiers.length; i++) {
      const price = roundTo500(base * Math.pow(STEP_MULTIPLIER, i));
      const res = await client.query(
        `INSERT INTO buyback_model_variants (model_id, variant_label, base_price, sort_order, active)
         VALUES ($1, $2, $3, $4, TRUE)
         ON CONFLICT (model_id, variant_label) DO NOTHING`,
        [row.id, tiers[i], price, i],
      );
      inserted += res.rowCount;
    }
  }

  const summary = await client.query(`
    SELECT b.name AS brand, COUNT(DISTINCT v.model_id)::int AS models_with_variants, COUNT(*)::int AS variant_rows
    FROM buyback_model_variants v
    JOIN models m ON m.id = v.model_id
    JOIN series s ON s.id = m.series_id
    JOIN brands b ON b.id = s.brand_id
    WHERE b.service_type = 'mobile'
    GROUP BY b.name ORDER BY b.name
  `);
  console.log(`Inserted ${inserted} variant row(s).`);
  console.log("Mobile variants by brand:", JSON.stringify(summary.rows, null, 2));
  await client.end();
}

run().catch((e) => { console.error(e); process.exit(1); });
