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
  const b = await client.query("SELECT id, name, slug, image_url FROM brands WHERE slug ILIKE '%realme%'");
  console.log('Brands:', b.rows);
  if (b.rows.length > 0) {
    const s = await client.query('SELECT id, name, slug, image_url FROM series WHERE brand_id = $1 LIMIT 10', [b.rows[0].id]);
    console.log('Realme series:', s.rows);
    const m = await client.query('SELECT id, name, slug, series_id, image_url FROM models WHERE brand_id = $1 LIMIT 10', [b.rows[0].id]);
    console.log('Realme models:', m.rows);
  }
  await client.end();
}

main().catch(console.error);
