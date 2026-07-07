// Creates the buyback_model_variants table (per-variant buyback prices,
// e.g. 64 GB / 128 GB / 256 GB). Safe to re-run — everything is IF NOT EXISTS.
// Usage: DATABASE_URL=postgresql://user:pass@host:5432/looplic node scripts/migrate-buyback-variants.cjs
const { Client } = require("pg");

const DB = process.env.DATABASE_URL;
if (!DB) {
  console.error("Set DATABASE_URL to the RDS connection string before running.");
  process.exit(1);
}

const SQL = `
CREATE TABLE IF NOT EXISTS buyback_model_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  variant_label TEXT NOT NULL,
  base_price NUMERIC NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(model_id, variant_label)
);

CREATE INDEX IF NOT EXISTS idx_buyback_model_variants_model_id ON buyback_model_variants(model_id);

DROP TRIGGER IF EXISTS trg_buyback_model_variants_updated_at ON buyback_model_variants;
CREATE TRIGGER trg_buyback_model_variants_updated_at
BEFORE UPDATE ON buyback_model_variants FOR EACH ROW EXECUTE FUNCTION set_updated_at();
`;

async function main() {
  const client = new Client({ connectionString: DB, ssl: { rejectUnauthorized: false } });
  await client.connect();
  await client.query(SQL);
  const check = await client.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name = 'buyback_model_variants' ORDER BY ordinal_position",
  );
  console.log("buyback_model_variants columns:", check.rows.map((r) => r.column_name).join(", "));
  await client.end();
  console.log("Migration complete.");
}

main().catch((err) => { console.error(err); process.exit(1); });
