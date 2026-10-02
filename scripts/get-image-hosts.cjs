const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const envPath = path.join('apps', 'user', '.env.local');
const env = Object.fromEntries(
  fs.readFileSync(envPath, 'utf8').split(/\r?\n/)
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

const conn = env.DATABASE_URL.replace(/^['"]|['"]$/g, '');
const client = new Client({
  connectionString: conn,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  const mRes = await client.query('SELECT DISTINCT image_url FROM models WHERE image_url IS NOT NULL');
  const sRes = await client.query('SELECT DISTINCT image_url FROM series WHERE image_url IS NOT NULL');
  const bRes = await client.query('SELECT DISTINCT image_url FROM brands WHERE image_url IS NOT NULL');
  
  const allUrls = [...mRes.rows, ...sRes.rows, ...bRes.rows].map(r => r.image_url);
  const hosts = new Map();
  for (const u of allUrls) {
    try {
      if (u.startsWith('http')) {
        const h = new URL(u).hostname;
        hosts.set(h, (hosts.get(h) || 0) + 1);
      }
    } catch {}
  }
  console.log('Distinct hosts in DB:');
  for (const [host, count] of hosts.entries()) {
    console.log(`  ${host}: ${count} URLs`);
  }
  await client.end();
}

main().catch(console.error);
