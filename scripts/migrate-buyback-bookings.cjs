// Creates the buyback_bookings table (customer pickup bookings from the sell
// flow). Safe to re-run — everything is IF NOT EXISTS.
// Usage: DATABASE_URL=postgresql://user:pass@host:5432/looplic node scripts/migrate-buyback-bookings.cjs
const { Client } = require("pg");

const DB = process.env.DATABASE_URL;
if (!DB) {
  console.error("Set DATABASE_URL to the RDS connection string before running.");
  process.exit(1);
}

const SQL = `
CREATE TABLE IF NOT EXISTS buyback_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_code TEXT NOT NULL UNIQUE,
  service_type TEXT NOT NULL DEFAULT 'mobile',
  brand_name TEXT NOT NULL,
  model_name TEXT NOT NULL,
  variant_label TEXT,
  quoted_amount NUMERIC,
  quote_breakdown TEXT,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  pickup_date TEXT,
  time_slot TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  user_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_buyback_bookings_status ON buyback_bookings(status);
CREATE INDEX IF NOT EXISTS idx_buyback_bookings_created_at ON buyback_bookings(created_at);

DROP TRIGGER IF EXISTS trg_buyback_bookings_updated_at ON buyback_bookings;
CREATE TRIGGER trg_buyback_bookings_updated_at
BEFORE UPDATE ON buyback_bookings FOR EACH ROW EXECUTE FUNCTION set_updated_at();
`;

async function main() {
  const client = new Client({ connectionString: DB, ssl: { rejectUnauthorized: false } });
  await client.connect();
  await client.query(SQL);
  const check = await client.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name = 'buyback_bookings' ORDER BY ordinal_position",
  );
  console.log("buyback_bookings columns:", check.rows.map((r) => r.column_name).join(", "));
  await client.end();
  console.log("Migration complete.");
}

main().catch((err) => { console.error(err); process.exit(1); });
