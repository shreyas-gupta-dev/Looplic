// Inserts PLACEHOLDER buyback base prices for every model that doesn't have
// one yet, so the sell flow works end-to-end while real dealer prices are
// gathered. Existing rows are never touched (ON CONFLICT DO NOTHING), so
// prices entered in the admin portal survive re-runs — replace samples
// model-by-model from Admin → Buyback → Prices whenever ready.
//
// Sample price = category base × brand multiplier × model-keyword bump,
// rounded to the nearest ₹500. Crude on purpose — these are placeholders.
// Usage: DATABASE_URL=postgresql://user:pass@host:5432/looplic node scripts/seed-buyback-sample-prices.cjs
const { Client } = require("pg");

const DB = process.env.DATABASE_URL;
if (!DB) {
  console.error("Set DATABASE_URL to the RDS connection string before running.");
  process.exit(1);
}

const CATEGORY_BASE = { mobile: 6000, laptop: 10000, tablet: 6000, smartwatch: 4000, audio: 2500 };

const BRAND_MULTIPLIER = [
  [/apple/i, 2.2],
  [/samsung/i, 1.5],
  [/google|pixel/i, 1.5],
  [/oneplus/i, 1.4],
  [/sony|bose/i, 1.6],
  [/garmin/i, 1.5],
  [/nothing|motorola|dell|hp|lenovo|asus|acer|msi/i, 1.0],
  [/fitbit|jbl/i, 1.0],
  [/xiaomi|redmi|poco|mi\b/i, 0.9],
  [/realme|vivo|oppo|iqoo|infinix|tecno|honor|lava/i, 0.9],
  [/amazfit|noise|boat/i, 0.7],
];

const MODEL_BUMP = [
  [/ultra|pro\s*max|fold/i, 1.6],
  [/\bpro\b|\bmax\b|\bplus\b|\+/i, 1.3],
  [/\bmini\b|\blite\b|\bgo\b|\bse\b|\bfe\b/i, 0.85],
];

function samplePrice(serviceType, brandName, modelName) {
  const base = CATEGORY_BASE[serviceType] ?? 5000;
  const brandMult = (BRAND_MULTIPLIER.find(([re]) => re.test(brandName)) || [null, 1.0])[1];
  let bump = 1.0;
  for (const [re, mult] of MODEL_BUMP) {
    if (re.test(modelName)) { bump = mult; break; }
  }
  const raw = base * brandMult * bump;
  return Math.max(500, Math.round(raw / 500) * 500);
}

async function run() {
  const client = new Client({ connectionString: DB, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const { rows } = await client.query(`
    SELECT m.id, m.name AS model_name, b.name AS brand_name, b.service_type
    FROM models m
    JOIN series s ON s.id = m.series_id
    JOIN brands b ON b.id = s.brand_id
    WHERE NOT EXISTS (SELECT 1 FROM buyback_model_prices p WHERE p.model_id = m.id)
    ORDER BY b.service_type, b.name, m.name
  `);
  console.log(`${rows.length} model(s) without a buyback price.`);

  let inserted = 0;
  for (const row of rows) {
    const price = samplePrice(row.service_type, row.brand_name, row.model_name);
    const res = await client.query(
      `INSERT INTO buyback_model_prices (model_id, base_price, active)
       VALUES ($1, $2, TRUE) ON CONFLICT (model_id) DO NOTHING`,
      [row.id, price],
    );
    inserted += res.rowCount;
  }

  const summary = await client.query(`
    SELECT b.service_type, COUNT(*)::int AS priced, ROUND(AVG(p.base_price))::int AS avg_price
    FROM buyback_model_prices p
    JOIN models m ON m.id = p.model_id
    JOIN series s ON s.id = m.series_id
    JOIN brands b ON b.id = s.brand_id
    GROUP BY b.service_type ORDER BY b.service_type
  `);
  console.log(`Inserted ${inserted} sample price(s).`);
  console.log("Priced models by category:", JSON.stringify(summary.rows));
  await client.end();
}

run().catch((e) => { console.error(e); process.exit(1); });
