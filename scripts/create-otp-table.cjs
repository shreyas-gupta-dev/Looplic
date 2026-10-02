const { Client } = require("pg");

async function main() {
  const client = new Client({
    connectionString: "postgresql://looplic_admin:LooplcRDS2024X1@looplic-db.cduy2kcwyva7.ap-south-1.rds.amazonaws.com:5432/looplic",
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log("Connected to RDS PostgreSQL");

  await client.query(`
    CREATE TABLE IF NOT EXISTS auth_email_otps (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      attempts INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_auth_email_otps_email ON auth_email_otps(email);
  `);

  console.log("Table auth_email_otps and index created successfully!");
  await client.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
