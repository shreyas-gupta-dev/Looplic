import pg from "pg";
const { Client } = pg;

const FIXES = {
  "pixel-10-series": "https://fdn2.gsmarena.com/vv/bigpic/google-pixel-8a.jpg",
  "pixel-4-series": "https://fdn2.gsmarena.com/vv/bigpic/google-pixel-4-r1.jpg",
  "pixel-5-series": "https://fdn2.gsmarena.com/vv/bigpic/google-pixel-5a-5g.jpg",
  "pixel-7-series": "https://fdn2.gsmarena.com/vv/bigpic/google-pixel-7a.jpg",
  "pixel-9-series": "https://fdn2.gsmarena.com/vv/bigpic/google-pixel-9-pro-.jpg",
  "oneplus-3-series": "https://fdn2.gsmarena.com/vv/bigpic/oneplus-3.jpg",
  "oneplus-6-series": "https://fdn2.gsmarena.com/vv/bigpic/oneplus-6-.jpg",
  "oneplus-9-series": "https://fdn2.gsmarena.com/vv/bigpic/oneplus-9r.jpg",
  "oneplus-nord-3-series": "https://fdn2.gsmarena.com/vv/bigpic/oneplus-nord-2t.jpg",
  "oneplus-nord-4-series": "https://fdn2.gsmarena.com/vv/bigpic/oneplus-nord-n30-5g.jpg",
  "oneplus-nord-ce-4": "https://fdn2.gsmarena.com/vv/bigpic/oneplus-nord-n30-5g.jpg",
  "reno-series": "https://fdn2.gsmarena.com/vv/bigpic/oppo-reno10.jpg",
  "realme-2-series": "https://fdn2.gsmarena.com/vv/bigpic/realme-c2.jpg",
  "realme-3-series": "https://fdn2.gsmarena.com/vv/bigpic/realme-3.jpg",
  "realme-5-series": "https://fdn2.gsmarena.com/vv/bigpic/realme-5.jpg",
  "realme-8-series": "https://fdn2.gsmarena.com/vv/bigpic/realme-8.jpg",
  "nex-series": "https://fdn2.gsmarena.com/vv/bigpic/vivo-nex-s.jpg",
  "t-series": "https://fdn2.gsmarena.com/vv/bigpic/vivo-t1-5g.jpg",
  "z-series": "https://fdn2.gsmarena.com/vv/bigpic/vivo-z5x.jpg",
  "13-series": "https://fdn2.gsmarena.com/vv/bigpic/xiaomi-13t.jpg",
  "17-series": "https://fdn2.gsmarena.com/vv/bigpic/xiaomi-14t-pro.jpg",
  "mi-series": "https://fdn2.gsmarena.com/vv/bigpic/xiaomi-mi-10-5g.jpg",
};

const client = new Client({
  connectionString: "postgresql://looplic_admin:LooplcRDS2024X1@looplic-db.cduy2kcwyva7.ap-south-1.rds.amazonaws.com:5432/looplic",
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  let fixed = 0;
  for (const [slug, url] of Object.entries(FIXES)) {
    const r = await client.query(`UPDATE series SET image_url = $1 WHERE slug = $2 RETURNING name`, [url, slug]);
    if (r.rows.length > 0) { fixed++; console.log(`✓ ${r.rows[0].name}`); }
  }
  console.log(`\nFixed: ${fixed}. Verifying all...`);

  const all = await client.query(`
    SELECT s.image_url, s.name, b.name as brand_name FROM series s
    JOIN brands b ON s.brand_id = b.id WHERE b.service_type = 'mobile'
  `);
  let ok = 0, broken = 0;
  for (const row of all.rows) {
    if (!row.image_url) { broken++; continue; }
    const r = await fetch(row.image_url, { method: "HEAD" });
    if (r.ok) ok++; else { broken++; console.log(`❌ ${row.brand_name} - ${row.name}`); }
  }
  console.log(`\n✅ ${ok}/${all.rows.length} working | ❌ ${broken} broken`);
  await client.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
