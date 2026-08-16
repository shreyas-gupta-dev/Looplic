import pg from "pg";
const { Client } = pg;

// Fix broken image URLs - these are the ones that returned 404 from GSMArena
// Using alternative confirmed-working URLs
const FIXES = {
  // Samsung - broken ones
  "galaxy-c-series": "https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-c7-pro.jpg",
  "galaxy-note-series": "https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-note-20-ultra.jpg",
  "galaxy-on-series": "https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-on8.jpg",
  "galaxy-s-series": "https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s24-ultra-5g.jpg",

  // Apple - check if any are broken
  "apple-iphone-17-series": "https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16-pro-max.jpg",
  "apple-iphone-air-series": "https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16.jpg",

  // Google
  "pixel-10-series": "https://fdn2.gsmarena.com/vv/bigpic/google-pixel-9-pro-fold.jpg",

  // OnePlus
  "oneplus-15-series": "https://fdn2.gsmarena.com/vv/bigpic/oneplus-13r.jpg",
  "oneplus-nord-5-series": "https://fdn2.gsmarena.com/vv/bigpic/oneplus-nord-ce4-lite.jpg",
  "oneplus-nord-6-series": "https://fdn2.gsmarena.com/vv/bigpic/oneplus-nord-ce4-lite.jpg",

  // Realme - newer series that may not have exact matches
  "realme-14-series": "https://fdn2.gsmarena.com/vv/bigpic/realme-12-pro.jpg",
  "realme-15-series": "https://fdn2.gsmarena.com/vv/bigpic/realme-12-pro.jpg",
  "realme-16-series": "https://fdn2.gsmarena.com/vv/bigpic/realme-12-pro.jpg",

  // Xiaomi
  "17-series": "https://fdn2.gsmarena.com/vv/bigpic/xiaomi-14-ultra.jpg",
  "redmi-14-series": "https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-13c.jpg",
  "redmi-15-series": "https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-13c.jpg",
};

const client = new Client({
  connectionString: "postgresql://looplic_admin:LooplcRDS2024X1@looplic-db.cduy2kcwyva7.ap-south-1.rds.amazonaws.com:5432/looplic",
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  console.log("Connected. Checking all series images for broken URLs...\n");

  // Get all series with their current image_url
  const res = await client.query(`
    SELECT s.id, s.name, s.slug, s.image_url, b.name as brand_name
    FROM series s
    JOIN brands b ON s.brand_id = b.id
    WHERE b.service_type = 'mobile' AND s.image_url IS NOT NULL AND s.image_url != ''
    ORDER BY b.name, s.name
  `);

  let checked = 0;
  let fixed = 0;
  let broken = [];

  for (const row of res.rows) {
    checked++;

    // Check if this slug has a fix
    if (FIXES[row.slug]) {
      await client.query(`UPDATE series SET image_url = $1 WHERE id = $2`, [FIXES[row.slug], row.id]);
      fixed++;
      console.log(`🔧 Fixed: ${row.brand_name} - ${row.name}`);
      continue;
    }

    // Verify the URL works by doing a HEAD request
    try {
      const response = await fetch(row.image_url, { method: "HEAD", redirect: "follow" });
      if (!response.ok) {
        broken.push({ brand: row.brand_name, name: row.name, slug: row.slug, url: row.image_url, status: response.status });
        console.log(`❌ ${response.status}: ${row.brand_name} - ${row.name} (${row.slug})`);
      }
    } catch (err) {
      broken.push({ brand: row.brand_name, name: row.name, slug: row.slug, url: row.image_url, status: "error" });
      console.log(`❌ Error: ${row.brand_name} - ${row.name} (${row.slug})`);
    }
  }

  console.log(`\n─── Summary ───`);
  console.log(`Checked: ${checked}`);
  console.log(`Fixed with new URL: ${fixed}`);
  console.log(`Still broken: ${broken.length}`);

  if (broken.length > 0) {
    console.log("\nBroken URLs that need fixing:");
    for (const b of broken) {
      console.log(`  ${b.brand} - ${b.name} (${b.slug}) [${b.status}]`);
    }
  }

  await client.end();
  console.log("\nDone!");
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
