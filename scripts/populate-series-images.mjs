import pg from "pg";
const { Client } = pg;

// Real device images from public CDNs (GSMArena thumbnails, Fdn.gsmarena.com)
// These are actual product photos that represent each series
const SERIES_IMAGES = {
  // ─── Apple ──────────────────────────────────────────────────────────────────
  "apple-iphone-5-series": "https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-5s.jpg",
  "apple-iphone-6-series": "https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-6s.jpg",
  "apple-iphone-7-series": "https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-7.jpg",
  "apple-iphone-8-series": "https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-8.jpg",
  "apple-iphone-x-xs-series": "https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-xs.jpg",
  "apple-iphone-11-series": "https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-11.jpg",
  "apple-iphone-12-series": "https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-12.jpg",
  "apple-iphone-13-series": "https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-13.jpg",
  "apple-iphone-14-series": "https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-14.jpg",
  "apple-iphone-15-series": "https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15.jpg",
  "apple-iphone-16-series": "https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16.jpg",
  "apple-iphone-17-series": "https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16-pro.jpg",
  "apple-iphone-se": "https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-se-2022.jpg",
  "apple-iphone-air-series": "https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16e.jpg",

  // ─── Samsung ────────────────────────────────────────────────────────────────
  "galaxy-a-series": "https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a55.jpg",
  "galaxy-c-series": "https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-c9-pro.jpg",
  "galaxy-f-series": "https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-f55.jpg",
  "galaxy-fold-series": "https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-fold6.jpg",
  "galaxy-j-series": "https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-j7-pro.jpg",
  "galaxy-m-series": "https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-m55.jpg",
  "galaxy-note-series": "https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-note20-ultra-5g.jpg",
  "galaxy-on-series": "https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-on7-2016.jpg",
  "galaxy-s-series": "https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s24-ultra.jpg",
  "galaxy-z-flip-series": "https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-flip6.jpg",

  // ─── OnePlus ────────────────────────────────────────────────────────────────
  "oneplus-3-series": "https://fdn2.gsmarena.com/vv/bigpic/oneplus-3t.jpg",
  "oneplus-5-series": "https://fdn2.gsmarena.com/vv/bigpic/oneplus-5t.jpg",
  "oneplus-6-series": "https://fdn2.gsmarena.com/vv/bigpic/oneplus-6t.jpg",
  "oneplus-7-series": "https://fdn2.gsmarena.com/vv/bigpic/oneplus-7-pro.jpg",
  "oneplus-8-series": "https://fdn2.gsmarena.com/vv/bigpic/oneplus-8-pro.jpg",
  "oneplus-9-series": "https://fdn2.gsmarena.com/vv/bigpic/oneplus-9-pro.jpg",
  "oneplus-10-series": "https://fdn2.gsmarena.com/vv/bigpic/oneplus-10-pro.jpg",
  "oneplus-11-series": "https://fdn2.gsmarena.com/vv/bigpic/oneplus-11.jpg",
  "oneplus-12-series": "https://fdn2.gsmarena.com/vv/bigpic/oneplus-12.jpg",
  "oneplus-13-series": "https://fdn2.gsmarena.com/vv/bigpic/oneplus-13.jpg",
  "oneplus-15-series": "https://fdn2.gsmarena.com/vv/bigpic/oneplus-13.jpg",
  "oneplus-nord-series": "https://fdn2.gsmarena.com/vv/bigpic/oneplus-nord.jpg",
  "oneplus-nord-2-series": "https://fdn2.gsmarena.com/vv/bigpic/oneplus-nord-2-5g.jpg",
  "oneplus-nord-3-series": "https://fdn2.gsmarena.com/vv/bigpic/oneplus-nord-3.jpg",
  "oneplus-nord-4-series": "https://fdn2.gsmarena.com/vv/bigpic/oneplus-nord-4.jpg",
  "oneplus-nord-5-series": "https://fdn2.gsmarena.com/vv/bigpic/oneplus-nord-4.jpg",
  "oneplus-nord-6-series": "https://fdn2.gsmarena.com/vv/bigpic/oneplus-nord-4.jpg",
  "oneplus-nord-ce-4": "https://fdn2.gsmarena.com/vv/bigpic/oneplus-nord-ce4.jpg",
  "oneplus-open": "https://fdn2.gsmarena.com/vv/bigpic/oneplus-open.jpg",

  // ─── Google Pixel ───────────────────────────────────────────────────────────
  "pixel-4-series": "https://fdn2.gsmarena.com/vv/bigpic/google-pixel-4-xl.jpg",
  "pixel-5-series": "https://fdn2.gsmarena.com/vv/bigpic/google-pixel-5.jpg",
  "pixel-6-series": "https://fdn2.gsmarena.com/vv/bigpic/google-pixel-6-pro.jpg",
  "pixel-7-series": "https://fdn2.gsmarena.com/vv/bigpic/google-pixel-7-pro.jpg",
  "pixel-8-series": "https://fdn2.gsmarena.com/vv/bigpic/google-pixel-8-pro.jpg",
  "pixel-9-series": "https://fdn2.gsmarena.com/vv/bigpic/google-pixel-9-pro.jpg",
  "pixel-10-series": "https://fdn2.gsmarena.com/vv/bigpic/google-pixel-9-pro.jpg",

  // ─── Xiaomi ─────────────────────────────────────────────────────────────────
  "11-series": "https://fdn2.gsmarena.com/vv/bigpic/xiaomi-mi-11.jpg",
  "12-series": "https://fdn2.gsmarena.com/vv/bigpic/xiaomi-12-pro.jpg",
  "13-series": "https://fdn2.gsmarena.com/vv/bigpic/xiaomi-13.jpg",
  "14-series": "https://fdn2.gsmarena.com/vv/bigpic/xiaomi-14.jpg",
  "15-series": "https://fdn2.gsmarena.com/vv/bigpic/xiaomi-15.jpg",
  "17-series": "https://fdn2.gsmarena.com/vv/bigpic/xiaomi-15.jpg",
  "mi-series": "https://fdn2.gsmarena.com/vv/bigpic/xiaomi-mi-10.jpg",
  "other-xiaomi-smartphones": "https://fdn2.gsmarena.com/vv/bigpic/xiaomi-mi-a3.jpg",
  "redmi-5-series": "https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-5-plus.jpg",
  "redmi-6-series": "https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-6-pro.jpg",
  "redmi-7-series": "https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-7.jpg",
  "redmi-8-series": "https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-8.jpg",
  "redmi-9-series": "https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-9.jpg",
  "redmi-10-series": "https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-10.jpg",
  "redmi-14-series": "https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-14c.jpg",
  "redmi-15-series": "https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-14c.jpg",
  "redmi-a-series": "https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-a3.jpg",
  "redmi-k-series": "https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-k70-pro.jpg",
  "redmi-note-series": "https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-note-13-pro.jpg",
  "redmi-y-series": "https://fdn2.gsmarena.com/vv/bigpic/xiaomi-redmi-y3.jpg",

  // ─── Realme ─────────────────────────────────────────────────────────────────
  "realme-1-series": "https://fdn2.gsmarena.com/vv/bigpic/oppo-realme-1.jpg",
  "realme-2-series": "https://fdn2.gsmarena.com/vv/bigpic/realme-2-pro.jpg",
  "realme-3-series": "https://fdn2.gsmarena.com/vv/bigpic/realme-3-pro.jpg",
  "realme-5-series": "https://fdn2.gsmarena.com/vv/bigpic/realme-5-pro.jpg",
  "realme-6-series": "https://fdn2.gsmarena.com/vv/bigpic/realme-6-pro.jpg",
  "realme-7-series": "https://fdn2.gsmarena.com/vv/bigpic/realme-7-pro.jpg",
  "realme-8-series": "https://fdn2.gsmarena.com/vv/bigpic/realme-8-pro.jpg",
  "realme-9-series": "https://fdn2.gsmarena.com/vv/bigpic/realme-9-pro-plus.jpg",
  "realme-10-series": "https://fdn2.gsmarena.com/vv/bigpic/realme-10-pro-plus.jpg",
  "realme-11-series": "https://fdn2.gsmarena.com/vv/bigpic/realme-11-pro-plus.jpg",
  "realme-12-series": "https://fdn2.gsmarena.com/vv/bigpic/realme-12-pro-plus.jpg",
  "realme-13-series": "https://fdn2.gsmarena.com/vv/bigpic/realme-13-pro-plus.jpg",
  "realme-14-series": "https://fdn2.gsmarena.com/vv/bigpic/realme-13-pro-plus.jpg",
  "realme-15-series": "https://fdn2.gsmarena.com/vv/bigpic/realme-13-pro-plus.jpg",
  "realme-16-series": "https://fdn2.gsmarena.com/vv/bigpic/realme-13-pro-plus.jpg",
  "realme-c-series": "https://fdn2.gsmarena.com/vv/bigpic/realme-c67.jpg",
  "realme-gt-series": "https://fdn2.gsmarena.com/vv/bigpic/realme-gt-5-pro.jpg",
  "realme-narzo-series": "https://fdn2.gsmarena.com/vv/bigpic/realme-narzo-70-pro.jpg",
  "realme-p-series": "https://fdn2.gsmarena.com/vv/bigpic/realme-p1-pro.jpg",
  "realme-u-series": "https://fdn2.gsmarena.com/vv/bigpic/realme-u1.jpg",
  "realme-x-series": "https://fdn2.gsmarena.com/vv/bigpic/realme-x3-superzoom.jpg",

  // ─── Vivo ───────────────────────────────────────────────────────────────────
  "v-series": "https://fdn2.gsmarena.com/vv/bigpic/vivo-v30-pro.jpg",
  "y-series": "https://fdn2.gsmarena.com/vv/bigpic/vivo-y200.jpg",
  "x-series": "https://fdn2.gsmarena.com/vv/bigpic/vivo-x100-pro.jpg",
  "t-series": "https://fdn2.gsmarena.com/vv/bigpic/vivo-t3-5g.jpg",
  "s-series": "https://fdn2.gsmarena.com/vv/bigpic/vivo-s18-pro.jpg",
  "u-series": "https://fdn2.gsmarena.com/vv/bigpic/vivo-u20.jpg",
  "z-series": "https://fdn2.gsmarena.com/vv/bigpic/vivo-z1-pro.jpg",
  "nex-series": "https://fdn2.gsmarena.com/vv/bigpic/vivo-nex-3-5g.jpg",

  // ─── Oppo ───────────────────────────────────────────────────────────────────
  "a-series": "https://fdn2.gsmarena.com/vv/bigpic/oppo-a79-5g.jpg",
  "find-series": "https://fdn2.gsmarena.com/vv/bigpic/oppo-find-x7-ultra.jpg",
  "f-series": "https://fdn2.gsmarena.com/vv/bigpic/oppo-f25-pro.jpg",
  "k-series": "https://fdn2.gsmarena.com/vv/bigpic/oppo-k12.jpg",
  "reno-series": "https://fdn2.gsmarena.com/vv/bigpic/oppo-reno-12-pro.jpg",
  "r-series": "https://fdn2.gsmarena.com/vv/bigpic/oppo-r17-pro.jpg",

  // ─── POCO ───────────────────────────────────────────────────────────────────
  "poco-c-series": "https://fdn2.gsmarena.com/vv/bigpic/xiaomi-poco-c65.jpg",
  "poco-f-series": "https://fdn2.gsmarena.com/vv/bigpic/xiaomi-poco-f6-pro.jpg",
  "poco-m-series": "https://fdn2.gsmarena.com/vv/bigpic/xiaomi-poco-m6-pro.jpg",
  "poco-x-series": "https://fdn2.gsmarena.com/vv/bigpic/xiaomi-poco-x6-pro.jpg",

  // ─── Motorola ───────────────────────────────────────────────────────────────
  "moto-edge-series": "https://fdn2.gsmarena.com/vv/bigpic/motorola-edge-50-pro.jpg",
  "moto-e-series": "https://fdn2.gsmarena.com/vv/bigpic/motorola-moto-e13.jpg",
  "moto-g-series": "https://fdn2.gsmarena.com/vv/bigpic/motorola-moto-g84.jpg",
  "moto-m-series": "https://fdn2.gsmarena.com/vv/bigpic/motorola-moto-m.jpg",
  "moto-one-series": "https://fdn2.gsmarena.com/vv/bigpic/motorola-one-fusion-plus.jpg",
  "moto-razr-series": "https://fdn2.gsmarena.com/vv/bigpic/motorola-razr-50-ultra.jpg",
  "moto-z-series": "https://fdn2.gsmarena.com/vv/bigpic/motorola-moto-z3-play.jpg",

  // ─── Single-series brands (All Models) ──────────────────────────────────────
  // These brands have a single "All Models" series — use a representative device
};

// For "All Models" series, we map by brand_name
const ALL_MODELS_BY_BRAND = {
  "Asus": "https://fdn2.gsmarena.com/vv/bigpic/asus-rog-phone-8.jpg",
  "Honor": "https://fdn2.gsmarena.com/vv/bigpic/honor-magic6-pro.jpg",
  "Infinix": "https://fdn2.gsmarena.com/vv/bigpic/infinix-note-40-pro.jpg",
  "iQOO": "https://fdn2.gsmarena.com/vv/bigpic/vivo-iqoo-12.jpg",
  "Lenovo": "https://fdn2.gsmarena.com/vv/bigpic/lenovo-legion-phone-duel-2.jpg",
  "LG": "https://fdn2.gsmarena.com/vv/bigpic/lg-v60-thinq.jpg",
  "Nokia": "https://fdn2.gsmarena.com/vv/bigpic/nokia-g42.jpg",
  "Nothing": "https://fdn2.gsmarena.com/vv/bigpic/nothing-phone-2.jpg",
  "Tecno": "https://fdn2.gsmarena.com/vv/bigpic/tecno-phantom-v-fold.jpg",
};

const client = new Client({
  connectionString: "postgresql://looplic_admin:LooplcRDS2024X1@looplic-db.cduy2kcwyva7.ap-south-1.rds.amazonaws.com:5432/looplic",
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  console.log("Connected to database.\n");

  // Get all mobile series
  const res = await client.query(`
    SELECT s.id, s.name, s.slug, s.image_url, b.name as brand_name
    FROM series s
    JOIN brands b ON s.brand_id = b.id
    WHERE b.service_type = 'mobile'
    ORDER BY b.name, s.name
  `);

  let updated = 0;
  let skipped = 0;
  let noImage = 0;

  for (const row of res.rows) {
    // Skip if already has a valid image
    if (row.image_url && row.image_url.trim()) {
      skipped++;
      continue;
    }

    let imageUrl = null;

    // Check if it's an "All Models" series — use brand-specific image
    if (row.slug === "all-models" && ALL_MODELS_BY_BRAND[row.brand_name]) {
      imageUrl = ALL_MODELS_BY_BRAND[row.brand_name];
    } else {
      // Look up by slug
      imageUrl = SERIES_IMAGES[row.slug] || null;
    }

    if (imageUrl) {
      await client.query(
        `UPDATE series SET image_url = $1 WHERE id = $2`,
        [imageUrl, row.id]
      );
      updated++;
      console.log(`✓ ${row.brand_name} - ${row.name} → ${imageUrl.split("/").pop()}`);
    } else {
      noImage++;
      console.log(`✗ No image for: ${row.brand_name} - ${row.name} (slug: ${row.slug})`);
    }
  }

  console.log(`\n─── Summary ───`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped (already had image): ${skipped}`);
  console.log(`No image available: ${noImage}`);
  console.log(`Total: ${res.rows.length}`);

  await client.end();
  console.log("\nDone!");
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
