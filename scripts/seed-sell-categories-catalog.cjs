// Seeds starter catalogs (brands → series → models) for the three new sell
// categories: tablet, smartwatch, audio. Idempotent — re-running skips rows
// that already exist, so it's safe to run after adding more entries below.
//
// Usage: DATABASE_URL=postgresql://user:pass@host:5432/looplic node scripts/seed-sell-categories-catalog.cjs
const { Client } = require("pg");

const DB = process.env.DATABASE_URL;
if (!DB) {
  console.error("Set DATABASE_URL to the RDS connection string before running.");
  process.exit(1);
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/["'’()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const CATALOG = {
  tablet: [
    {
      name: "Apple", slug: "apple-tablet", letter: "A", gradient: "from-gray-700 to-gray-900", sort_order: 1,
      series: [
        { name: "iPad Pro", slug: "ipad-pro", models: ["iPad Pro 13\" (M4)", "iPad Pro 12.9\" (M2)", "iPad Pro 12.9\" (M1)", "iPad Pro 11\" (M4)", "iPad Pro 11\" (M2)", "iPad Pro 11\" (M1)"] },
        { name: "iPad Air", slug: "ipad-air", models: ["iPad Air 13\" (M2)", "iPad Air 11\" (M2)", "iPad Air 5", "iPad Air 4", "iPad Air 3"] },
        { name: "iPad", slug: "ipad", models: ["iPad 10th Gen", "iPad 9th Gen", "iPad 8th Gen", "iPad 7th Gen"] },
        { name: "iPad Mini", slug: "ipad-mini", models: ["iPad Mini 7", "iPad Mini 6", "iPad Mini 5"] },
      ],
    },
    {
      name: "Samsung", slug: "samsung-tablet", letter: "S", gradient: "from-blue-500 to-blue-700", sort_order: 2,
      series: [
        { name: "Galaxy Tab S", slug: "galaxy-tab-s", models: ["Galaxy Tab S9 Ultra", "Galaxy Tab S9+", "Galaxy Tab S9", "Galaxy Tab S9 FE", "Galaxy Tab S8 Ultra", "Galaxy Tab S8+", "Galaxy Tab S8", "Galaxy Tab S7 FE", "Galaxy Tab S7"] },
        { name: "Galaxy Tab A", slug: "galaxy-tab-a", models: ["Galaxy Tab A9+", "Galaxy Tab A9", "Galaxy Tab A8", "Galaxy Tab A7"] },
      ],
    },
    {
      name: "Lenovo", slug: "lenovo-tablet", letter: "L", gradient: "from-red-500 to-rose-600", sort_order: 3,
      series: [
        { name: "Tab P Series", slug: "lenovo-tab-p", models: ["Lenovo Tab P12", "Lenovo Tab P11 Pro", "Lenovo Tab P11"] },
        { name: "Tab M Series", slug: "lenovo-tab-m", models: ["Lenovo Tab M11", "Lenovo Tab M10 Plus", "Lenovo Tab M10", "Lenovo Tab M9", "Lenovo Tab M8"] },
      ],
    },
    {
      name: "Xiaomi", slug: "xiaomi-tablet", letter: "Mi", gradient: "from-orange-400 to-orange-600", sort_order: 4,
      series: [
        { name: "Xiaomi Pad", slug: "xiaomi-pad", models: ["Xiaomi Pad 6", "Xiaomi Pad 5"] },
        { name: "Redmi Pad", slug: "redmi-pad", models: ["Redmi Pad", "Redmi Pad SE"] },
      ],
    },
    {
      name: "OnePlus", slug: "oneplus-tablet", letter: "1+", gradient: "from-red-500 to-red-700", sort_order: 5,
      series: [
        { name: "OnePlus Pad", slug: "oneplus-pad", models: ["OnePlus Pad", "OnePlus Pad Go"] },
      ],
    },
    {
      name: "Realme", slug: "realme-tablet", letter: "R", gradient: "from-yellow-400 to-amber-500", sort_order: 6,
      series: [
        { name: "Realme Pad", slug: "realme-pad", models: ["Realme Pad 2", "Realme Pad X", "Realme Pad", "Realme Pad Mini"] },
      ],
    },
  ],

  smartwatch: [
    {
      name: "Apple", slug: "apple-watch", letter: "A", gradient: "from-gray-700 to-gray-900", sort_order: 1,
      series: [
        { name: "Apple Watch Ultra", slug: "apple-watch-ultra", models: ["Apple Watch Ultra 2", "Apple Watch Ultra"] },
        { name: "Apple Watch Series", slug: "apple-watch-series", models: ["Apple Watch Series 9", "Apple Watch Series 8", "Apple Watch Series 7", "Apple Watch Series 6", "Apple Watch Series 5", "Apple Watch Series 4"] },
        { name: "Apple Watch SE", slug: "apple-watch-se", models: ["Apple Watch SE (2nd Gen)", "Apple Watch SE (1st Gen)"] },
      ],
    },
    {
      name: "Samsung", slug: "samsung-watch", letter: "S", gradient: "from-blue-500 to-blue-700", sort_order: 2,
      series: [
        { name: "Galaxy Watch", slug: "galaxy-watch", models: ["Galaxy Watch 6 Classic", "Galaxy Watch 6", "Galaxy Watch 5 Pro", "Galaxy Watch 5", "Galaxy Watch 4 Classic", "Galaxy Watch 4", "Galaxy Watch FE"] },
      ],
    },
    {
      name: "Google", slug: "google-watch", letter: "G", gradient: "from-red-400 to-yellow-400", sort_order: 3,
      series: [
        { name: "Pixel Watch", slug: "pixel-watch", models: ["Pixel Watch 2", "Pixel Watch"] },
      ],
    },
    {
      name: "OnePlus", slug: "oneplus-watch", letter: "1+", gradient: "from-red-500 to-red-700", sort_order: 4,
      series: [
        { name: "OnePlus Watch", slug: "oneplus-watch", models: ["OnePlus Watch 2", "OnePlus Watch"] },
      ],
    },
    {
      name: "Amazfit", slug: "amazfit", letter: "Am", gradient: "from-emerald-500 to-teal-600", sort_order: 5,
      series: [
        { name: "Amazfit", slug: "amazfit", models: ["Amazfit GTR 4", "Amazfit GTS 4", "Amazfit T-Rex 2"] },
      ],
    },
    {
      name: "Garmin", slug: "garmin", letter: "G", gradient: "from-sky-600 to-blue-800", sort_order: 6,
      series: [
        { name: "Garmin", slug: "garmin", models: ["Garmin Venu 3", "Garmin Forerunner 265", "Garmin Instinct 2"] },
      ],
    },
    {
      name: "Fitbit", slug: "fitbit", letter: "F", gradient: "from-teal-400 to-cyan-600", sort_order: 7,
      series: [
        { name: "Fitbit", slug: "fitbit", models: ["Fitbit Sense 2", "Fitbit Versa 4", "Fitbit Charge 6"] },
      ],
    },
  ],

  audio: [
    {
      name: "Apple", slug: "apple-audio", letter: "A", gradient: "from-gray-700 to-gray-900", sort_order: 1,
      series: [
        { name: "AirPods", slug: "airpods", models: ["AirPods Pro (2nd Gen)", "AirPods Pro", "AirPods 3", "AirPods 2", "AirPods Max"] },
      ],
    },
    {
      name: "Samsung", slug: "samsung-audio", letter: "S", gradient: "from-blue-500 to-blue-700", sort_order: 2,
      series: [
        { name: "Galaxy Buds", slug: "galaxy-buds", models: ["Galaxy Buds 2 Pro", "Galaxy Buds 2", "Galaxy Buds Pro", "Galaxy Buds FE", "Galaxy Buds Live"] },
      ],
    },
    {
      name: "Sony", slug: "sony-audio", letter: "S", gradient: "from-zinc-700 to-zinc-900", sort_order: 3,
      series: [
        { name: "Headphones", slug: "sony-headphones", models: ["Sony WH-1000XM5", "Sony WH-1000XM4", "Sony WH-CH720N"] },
        { name: "Earbuds", slug: "sony-earbuds", models: ["Sony WF-1000XM5", "Sony WF-1000XM4"] },
      ],
    },
    {
      name: "Bose", slug: "bose", letter: "B", gradient: "from-neutral-600 to-neutral-800", sort_order: 4,
      series: [
        { name: "Bose", slug: "bose", models: ["Bose QuietComfort Ultra", "Bose QuietComfort 45", "Bose QC Earbuds II"] },
      ],
    },
    {
      name: "JBL", slug: "jbl", letter: "J", gradient: "from-orange-500 to-red-600", sort_order: 5,
      series: [
        { name: "JBL", slug: "jbl", models: ["JBL Tour Pro 2", "JBL Tune 770NC", "JBL Live 660NC"] },
      ],
    },
    {
      name: "OnePlus", slug: "oneplus-audio", letter: "1+", gradient: "from-red-500 to-red-700", sort_order: 6,
      series: [
        { name: "OnePlus Buds", slug: "oneplus-buds", models: ["OnePlus Buds Pro 2", "OnePlus Buds Pro", "OnePlus Buds 3", "OnePlus Nord Buds 2"] },
      ],
    },
  ],
};

async function run() {
  const client = new Client({ connectionString: DB, ssl: { rejectUnauthorized: false } });
  await client.connect();

  let brandCount = 0;
  let seriesCount = 0;
  let modelCount = 0;

  for (const [serviceType, brands] of Object.entries(CATALOG)) {
    console.log(`\n=== ${serviceType} ===`);
    for (const brand of brands) {
      const existing = await client.query(
        "SELECT id FROM brands WHERE slug = $1 AND service_type = $2",
        [brand.slug, serviceType],
      );

      let brandId;
      if (existing.rows.length > 0) {
        brandId = existing.rows[0].id;
        console.log(`  Brand already exists: ${brand.name} (${brandId})`);
      } else {
        const res = await client.query(
          `INSERT INTO brands (name, slug, letter, gradient, sort_order, service_type)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
          [brand.name, brand.slug, brand.letter, brand.gradient, brand.sort_order, serviceType],
        );
        brandId = res.rows[0].id;
        brandCount++;
        console.log(`  Inserted brand: ${brand.name} (${brandId})`);
      }

      for (const s of brand.series) {
        const existingSeries = await client.query(
          "SELECT id FROM series WHERE brand_id = $1 AND slug = $2",
          [brandId, s.slug],
        );

        let seriesId;
        if (existingSeries.rows.length > 0) {
          seriesId = existingSeries.rows[0].id;
        } else {
          const sRes = await client.query(
            "INSERT INTO series (brand_id, name, slug) VALUES ($1, $2, $3) RETURNING id",
            [brandId, s.name, s.slug],
          );
          seriesId = sRes.rows[0].id;
          seriesCount++;
        }

        for (const modelName of s.models) {
          const modelSlug = slugify(modelName);
          const existingModel = await client.query(
            "SELECT id FROM models WHERE series_id = $1 AND slug = $2",
            [seriesId, modelSlug],
          );
          if (existingModel.rows.length === 0) {
            await client.query(
              "INSERT INTO models (series_id, name, slug) VALUES ($1, $2, $3)",
              [seriesId, modelName, modelSlug],
            );
            modelCount++;
          }
        }
      }
    }
  }

  console.log(`\nDone! Inserted: ${brandCount} brands, ${seriesCount} series, ${modelCount} models`);
  await client.end();
}

run().catch((e) => { console.error(e); process.exit(1); });
