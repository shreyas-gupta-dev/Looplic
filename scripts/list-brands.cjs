const { Client } = require('pg');
const fs = require('fs');

async function main() {
  const env = fs.readFileSync('apps/user/.env.local', 'utf8');
  const dbUrl = env.match(/DATABASE_URL=(.*)/)[1].trim().replace(/^["']|["']$/g, '');
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const countRes = await client.query(
    'SELECT service_type, count(*) as count FROM brands GROUP BY service_type'
  );
  console.table(countRes.rows);

  await client.end();
}

main().catch(console.error);
