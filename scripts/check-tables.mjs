import pg from "pg";
const { Client } = pg;
const client = new Client({
  connectionString: "postgresql://looplic_admin:LooplcRDS2024X1@looplic-db.cduy2kcwyva7.ap-south-1.rds.amazonaws.com:5432/looplic",
  ssl: { rejectUnauthorized: false },
});
await client.connect();
const res = await client.query(`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`);
console.log("All tables:", res.rows.map(r => r.tablename).join(", "));
await client.end();
