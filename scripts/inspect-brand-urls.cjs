const { Client } = require('pg');
const fs = require('fs');

async function main() {
  const env = fs.readFileSync('apps/user/.env.local', 'utf8');
  const dbUrl = env.match(/DATABASE_URL=(.*)/)[1].trim().replace(/^['"]|['"]$/g, '');
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const res = await client.query('SELECT name, slug, image_url, service_type FROM brands ORDER BY service_type, sort_order');
  for (const r of res.rows) {
    console.log(`${r.service_type} | ${r.name.padEnd(12)} | ${r.slug.padEnd(15)} | ${r.image_url}`);
  }
  await client.end();
}

main().catch(console.error);
