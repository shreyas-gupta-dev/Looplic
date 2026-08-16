import pg from "pg";
const { Client } = pg;

// All remaining broken URLs fixed with verified GSMArena image paths
// These use the correct naming convention: brand-model-variant.jpg
const FIXES = {
  // Apple
  "apple-iphone-7-series": "https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-7-r1.jpg",

  // Google Pixel
  "pixel-4-series": "https://fdn2.gsmarena.com/vv/bigpic/google-pixel-4-xl-r1.jpg",
  "pixel-5-series": "https://fdn2.gsmarena.com/vv/bigpic/google-pixel-5-r1.jpg",
  "pixel-7-series": "https://fdn2.gsmarena.com/vv/bigpic/google-pixel-7-pro-new.jpg",
  "pixel-9-series": "https://fdn2.gsmarena.com/vv/bigpic/google-pixel-9-pro-xl.jpg",

  // Single-brand All Models
  "all-models": null, // handled per-brand below

  // Motorola
  "moto-z-series": "https://fdn2.gsmarena.com/vv/bigpic/motorola-moto-z2-play.jpg",

  // OnePlus
  "oneplus-3-series": "https://fdn2.gsmarena.com/vv/bigpic/oneplus-3t-r1.jpg",
  "oneplus-6-series": "https://fdn2.gsmarena.com/vv/bigpic/oneplus-6t-r1.jpg",
  "oneplus-7-series": "https://fdn2.gsmarena.com/vv/bigpic/oneplus-7-pro-r1.jpg",
  "oneplus-9-series": "https://fdn2.gsmarena.com/vv/bigpic/oneplus-9-pro-r1.jpg",
  "oneplus-nord-3-series": "https://fdn2.gsmarena.com/vv/bigpic/oneplus-nord3-5g.jpg",
  "oneplus-nord-4-series": "https://fdn2.gsmarena.com/vv/bigpic/oneplus-nord-4-.jpg",
  "oneplus-nord-ce-4": "https://fdn2.gsmarena.com/vv/bigpic/oneplus-nord-ce4-.jpg",
  "oneplus-open": "https://fdn2.gsmarena.com/vv/bigpic/oneplus-open-.jpg",

  // Oppo
  "reno-series": "https://fdn2.gsmarena.com/vv/bigpic/oppo-reno12-pro.jpg",

  // Realme
  "realme-2-series": "https://fdn2.gsmarena.com/vv/bigpic/realme-2-pro-r1.jpg",
  "realme-3-series": "https://fdn2.gsmarena.com/vv/bigpic/realme-3-pro-r1.jpg",
  "realme-5-series": "https://fdn2.gsmarena.com/vv/bigpic/realme-5-pro-r1.jpg",
  "realme-8-series": "https://fdn2.gsmarena.com/vv/bigpic/realme-8-pro-r4.jpg",
  "realme-c-series": "https://fdn2.gsmarena.com/vv/bigpic/realme-c55.jpg",
  "realme-gt-series": "https://fdn2.gsmarena.com/vv/bigpic/realme-gt5-pro.jpg",

  // Vivo
  "nex-series": "https://fdn2.gsmarena.com/vv/bigpic/vivo-nex-3.jpg",
  "t-series": "https://fdn2.gsmarena.com/vv/bigpic/vivo-t2-5g-india.jpg",
  "y-series": "https://fdn2.gsmarena.com/vv/bigpic/vivo-y100.jpg",
  "z-series": "https://fdn2.gsmarena.com/vv/bigpic/vivo-z1pro.jpg",

  // Xiaomi
  "11-series": "https://fdn2.gsmarena.com/vv/bigpic/xiaomi-11t-pro.jpg",
  "13-series": "https://fdn2.gsmarena.com/vv/bigpic/xiaomi-13-r1.jpg",
  "mi-series": "https://fdn2.gsmarena.com/vv/bigpic/xiaomi-mi-10t-pro-5g.jpg",
};

// For "All Models" brands that had 404
const ALL_MODELS_FIXES = {
  "Infinix": "https://fdn2.gsmarena.com/vv/bigpic/infinix-note-30.jpg",
  "iQOO": "https://fdn2.gsmarena.com/vv/bigpic/vivo-iqoo-neo9-pro.jpg",
  "Lenovo": "https://fdn2.gsmarena.com/vv/bigpic/lenovo-legion-duel.jpg",
  "LG": "https://fdn2.gsmarena.com/vv/bigpic/lg-v60-thinq-5g.jpg",
  "Nokia": "https://fdn2.gsmarena.com/vv/bigpic/nokia-g42-5g.jpg",
  "Nothing": "https://fdn2.gsmarena.com/vv/bigpic/nothing-phone-(2).jpg",
};

const client = new Client({
  connectionString: "postgresql://looplic_admin:LooplcRDS2024X1@looplic-db.cduy2kcwyva7.ap-south-1.rds.amazonaws.com:5432/looplic",
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  console.log("Connected. Fixing remaining broken images...\n");

  let fixed = 0;

  // Fix by slug (non-All-Models)
  for (const [slug, url] of Object.entries(FIXES)) {
    if (!url) continue; // skip the null "all-models" entry
    const result = await client.query(
      `UPDATE series SET image_url = $1 WHERE slug = $2 AND image_url IS NOT NULL RETURNING id, name`,
      [url, slug]
    );
    if (result.rows.length > 0) {
      fixed++;
      console.log(`✓ Fixed: ${result.rows[0].name} → ${url.split("/").pop()}`);
    }
  }

  // Fix "All Models" by brand name
  for (const [brandName, url] of Object.entries(ALL_MODELS_FIXES)) {
    const result = await client.query(`
      UPDATE series SET image_url = $1
      WHERE slug = 'all-models'
        AND brand_id = (SELECT id FROM brands WHERE name = $2 AND service_type = 'mobile' LIMIT 1)
      RETURNING id, name
    `, [url, brandName]);
    if (result.rows.length > 0) {
      fixed++;
      console.log(`✓ Fixed: ${brandName} - All Models → ${url.split("/").pop()}`);
    }
  }

  console.log(`\n─── Fixed ${fixed} images ───`);

  // Verify all remaining
  const remaining = await client.query(`
    SELECT s.slug, s.image_url, b.name as brand_name, s.name
    FROM series s JOIN brands b ON s.brand_id = b.id
    WHERE b.service_type = 'mobile' AND (s.image_url IS NULL OR s.image_url = '')
  `);
  if (remaining.rows.length > 0) {
    console.log(`\n⚠ Still missing images: ${remaining.rows.length}`);
    remaining.rows.forEach(r => console.log(`  ${r.brand_name} - ${r.name}`));
  } else {
    console.log("\n✅ All series have images!");
  }

  await client.end();
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
