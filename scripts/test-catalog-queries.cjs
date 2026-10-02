const fs = require("fs");

async function main() {
  const env = fs.readFileSync("apps/user/.env.local", "utf8");
  const dbUrl = env.match(/DATABASE_URL=(.*)/)[1].trim().replace(/^["']|["']$/g, "");
  process.env.DATABASE_URL = dbUrl;
  process.env.DATABASE_SSL = "true";

  const { Pool } = require("pg");
  const { drizzle } = require("drizzle-orm/node-postgres");
  const { eq, and, asc } = require("drizzle-orm");

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  // Test pool connection
  const res = await pool.query("SELECT NOW()");
  console.log("Pool connection OK:", res.rows[0]);

  // Test drizzle query on brands
  const schema = require("./packages/db/schema.ts");
  // Oh, schema.ts is TypeScript, so let's use ts-node or run via jiti or tsx.
}

main().catch(console.error);
