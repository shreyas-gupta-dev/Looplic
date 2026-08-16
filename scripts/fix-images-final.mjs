import pg from "pg";
const { Client } = pg;

// Final round of fixes with verified working URLs
const SLUG_FIXES = {
  "galaxy-s-series": "https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s24-ultra-5g-.jpg",
  "galaxy-note-series": "https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-note20-ultra-.jpg",
  "galaxy-on-series": "https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-on5.jpg",
  "apple-iphone-7-series": "https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-7-1.jpg",
  "oneplus-open": "https://fdn2.gsmarena.com/vv/bigpic/oneplus-12r.jpg",
  "oneplus-nord-4-series": "https://fdn2.gsmarena.com/vv/bigpic/oneplus-nord3-5g.jpg",
  "oneplus-nord-ce-4": "https://fdn2.gsmarena.com/vv/bigpic/oneplus-nord3-5g.jpg",
};

const BRAND_FIXES = {
  "Nothing": "https://fdn2.gsmarena.com/vv/bigpic/nothing-phone-2a.jpg",
  "iQOO": "https://fdn2.gsmarena.com/vv/bigpic/vivo-iqoo-neo7.jpg",
  "Lenovo": "https://fdn2.gsmarena.com/vv/bigpic/lenovo-k14-plus.jpg",
  "LG": "https://fdn2.gsmarena.com/vv/bigpic/lg-g8x-thinq.jpg",
  "Infinix": "https://fdn2.gsmarena.com/vv/bigpic/infinix-hot-30.jpg",
};

const client = new Client({
  connectionString: "postgresql://looplic_admin:LooplcRDS2024X1@looplic-db.cduy2kcwyva7.ap-south-1.rds.amazonaws.com:5432/looplic",
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  let fixed = 0;

  for (const [slug, url] of Object.entries(SLUG_FIXES)) {
    const result = await client.query(`UPDATE series SET image_url = $1 WHERE slug = $2 RETURNING name`, [url, slug]);
    if (result.rows.length > 0) {
      fixed++;
      console.log(`✓ ${result.rows[0].name}`);
    }
  }

  for (const [brandName, url] of Object.entries(BRAND_FIXES)) {
    const result = await client.query(`
      UPDATE series SET image_url = $1
      WHERE slug = 'all-models'
        AND brand_id = (SELECT id FROM brands WHERE name = $2 AND service_type = 'mobile' LIMIT 1)
      RETURNING name
    `, [url, brandName]);
    if (result.rows.length > 0) {
      fixed++;
      console.log(`✓ ${brandName} - All Models`);
    }
  }

  // Now verify ALL images are working
  console.log(`\nFixed: ${fixed}. Now verifying all 125 images...\n`);

  const all = await client.query(`
    SELECT s.image_url, s.name, b.name as brand_name
    FROM series s JOIN brands b ON s.brand_id = b.id
    WHERE b.service_type = 'mobile'
    ORDER BY b.name, s.name
  `);

  let ok = 0, broken = 0;
  for (const row of all.rows) {
    if (!row.image_url) { broken++; console.log(`❌ No URL: ${row.brand_name} - ${row.name}`); continue; }
    try {
      const r = await fetch(row.image_url, { method: "HEAD" });
      if (r.ok) { ok++; }
      else { broken++; console.log(`❌ ${r.status}: ${row.brand_name} - ${row.name}`); }
    } catch { broken++; console.log(`❌ Error: ${row.brand_name} - ${row.name}`); }
  }

  console.log(`\n✅ Working: ${ok}/${all.rows.length}`);
  if (broken > 0) console.log(`❌ Broken: ${broken}`);
  await client.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
