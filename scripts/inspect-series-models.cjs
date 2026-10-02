const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const env = Object.fromEntries(
  fs.readFileSync('apps/user/.env.local', 'utf8').split(/\r?\n/)
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
const client = new Client({
  connectionString: env.DATABASE_URL.replace(/^['"]|['"]$/g, ''),
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  const seriesRes = await client.query("SELECT id, name, slug, image_url FROM series WHERE name ILIKE '%Realme 10%'");
  console.log('Realme 10 series:', seriesRes.rows);
  if (seriesRes.rows.length > 0) {
    const sId = seriesRes.rows[0].id;
    const modelsRes = await client.query("SELECT id, name, slug, image_url FROM models WHERE series_id = $1", [sId]);
    console.log('Realme 10 models:', modelsRes.rows);
  }
  await client.end();
}

main().catch(console.error);
