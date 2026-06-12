const { Client } = require("pg");

const DB = "postgresql://looplic_admin:LooplcRDS2024X1@looplic-db.cduy2kcwyva7.ap-south-1.rds.amazonaws.com:5432/looplic";

const DATA = [
  {
    name: "Apple", slug: "apple", letter: "A", gradient: "from-gray-700 to-gray-900", sort_order: 1,
    series: [
      { name: "iPhone 16 Series", slug: "iphone-16-series", models: ["iPhone 16", "iPhone 16 Plus", "iPhone 16 Pro", "iPhone 16 Pro Max"] },
      { name: "iPhone 15 Series", slug: "iphone-15-series", models: ["iPhone 15", "iPhone 15 Plus", "iPhone 15 Pro", "iPhone 15 Pro Max"] },
      { name: "iPhone 14 Series", slug: "iphone-14-series", models: ["iPhone 14", "iPhone 14 Plus", "iPhone 14 Pro", "iPhone 14 Pro Max"] },
      { name: "iPhone 13 Series", slug: "iphone-13-series", models: ["iPhone 13", "iPhone 13 Mini", "iPhone 13 Pro", "iPhone 13 Pro Max"] },
      { name: "iPhone 12 Series", slug: "iphone-12-series", models: ["iPhone 12", "iPhone 12 Mini", "iPhone 12 Pro", "iPhone 12 Pro Max"] },
      { name: "iPhone 11 Series", slug: "iphone-11-series", models: ["iPhone 11", "iPhone 11 Pro", "iPhone 11 Pro Max"] },
      { name: "iPhone X / XS Series", slug: "iphone-x-series", models: ["iPhone X", "iPhone XR", "iPhone XS", "iPhone XS Max"] },
      { name: "iPhone SE", slug: "iphone-se", models: ["iPhone SE (2nd Gen)", "iPhone SE (3rd Gen)"] },
    ],
  },
  {
    name: "Samsung", slug: "samsung", letter: "S", gradient: "from-blue-500 to-blue-700", sort_order: 2,
    series: [
      { name: "Galaxy S24 Series", slug: "galaxy-s24-series", models: ["Galaxy S24", "Galaxy S24+", "Galaxy S24 Ultra", "Galaxy S24 FE"] },
      { name: "Galaxy S23 Series", slug: "galaxy-s23-series", models: ["Galaxy S23", "Galaxy S23+", "Galaxy S23 Ultra", "Galaxy S23 FE"] },
      { name: "Galaxy S22 Series", slug: "galaxy-s22-series", models: ["Galaxy S22", "Galaxy S22+", "Galaxy S22 Ultra"] },
      { name: "Galaxy A Series (2024)", slug: "galaxy-a-2024", models: ["Galaxy A55", "Galaxy A35", "Galaxy A25", "Galaxy A15"] },
      { name: "Galaxy A Series (2023)", slug: "galaxy-a-2023", models: ["Galaxy A54", "Galaxy A34", "Galaxy A24", "Galaxy A14", "Galaxy A04"] },
      { name: "Galaxy M Series", slug: "galaxy-m-series", models: ["Galaxy M55", "Galaxy M35", "Galaxy M15", "Galaxy M14", "Galaxy M13"] },
      { name: "Galaxy F Series", slug: "galaxy-f-series", models: ["Galaxy F55", "Galaxy F34", "Galaxy F14", "Galaxy F13"] },
    ],
  },
  {
    name: "OnePlus", slug: "oneplus", letter: "1+", gradient: "from-red-500 to-red-700", sort_order: 3,
    series: [
      { name: "OnePlus 12 Series", slug: "oneplus-12-series", models: ["OnePlus 12", "OnePlus 12R"] },
      { name: "OnePlus 11 Series", slug: "oneplus-11-series", models: ["OnePlus 11", "OnePlus 11R"] },
      { name: "OnePlus 10 Series", slug: "oneplus-10-series", models: ["OnePlus 10 Pro", "OnePlus 10T", "OnePlus 10R"] },
      { name: "OnePlus 9 Series", slug: "oneplus-9-series", models: ["OnePlus 9", "OnePlus 9 Pro", "OnePlus 9R", "OnePlus 9RT"] },
      { name: "OnePlus Nord 3 Series", slug: "oneplus-nord-3-series", models: ["OnePlus Nord 3", "OnePlus Nord CE 3", "OnePlus Nord CE 3 Lite"] },
      { name: "OnePlus Nord 2 Series", slug: "oneplus-nord-2-series", models: ["OnePlus Nord 2T", "OnePlus Nord CE 2", "OnePlus Nord CE 2 Lite"] },
    ],
  },
  {
    name: "Xiaomi", slug: "xiaomi", letter: "Mi", gradient: "from-orange-400 to-orange-600", sort_order: 4,
    series: [
      { name: "Redmi Note 13 Series", slug: "redmi-note-13-series", models: ["Redmi Note 13", "Redmi Note 13 Pro", "Redmi Note 13 Pro+"] },
      { name: "Redmi Note 12 Series", slug: "redmi-note-12-series", models: ["Redmi Note 12", "Redmi Note 12 Pro", "Redmi Note 12 Pro+"] },
      { name: "Redmi 13 Series", slug: "redmi-13-series", models: ["Redmi 13C", "Redmi 13", "Redmi 13 5G"] },
      { name: "POCO X Series", slug: "poco-x-series", models: ["POCO X6", "POCO X6 Pro", "POCO X5", "POCO X5 Pro"] },
      { name: "POCO M Series", slug: "poco-m-series", models: ["POCO M6 Pro", "POCO M5", "POCO M5s", "POCO M4 Pro"] },
      { name: "POCO C Series", slug: "poco-c-series", models: ["POCO C65", "POCO C55", "POCO C50"] },
    ],
  },
  {
    name: "Google", slug: "google", letter: "G", gradient: "from-red-400 to-yellow-400", sort_order: 5,
    series: [
      { name: "Pixel 8 Series", slug: "pixel-8-series", models: ["Pixel 8", "Pixel 8 Pro", "Pixel 8a"] },
      { name: "Pixel 7 Series", slug: "pixel-7-series", models: ["Pixel 7", "Pixel 7 Pro", "Pixel 7a"] },
      { name: "Pixel 6 Series", slug: "pixel-6-series", models: ["Pixel 6", "Pixel 6 Pro", "Pixel 6a"] },
    ],
  },
  {
    name: "Vivo", slug: "vivo", letter: "V", gradient: "from-blue-400 to-purple-500", sort_order: 6,
    series: [
      { name: "V30 Series", slug: "v30-series", models: ["Vivo V30", "Vivo V30 Pro", "Vivo V30e"] },
      { name: "V29 Series", slug: "v29-series", models: ["Vivo V29", "Vivo V29 Pro", "Vivo V29e"] },
      { name: "V27 Series", slug: "v27-series", models: ["Vivo V27", "Vivo V27 Pro", "Vivo V27e"] },
      { name: "Y Series", slug: "vivo-y-series", models: ["Vivo Y100", "Vivo Y78", "Vivo Y56", "Vivo Y35", "Vivo Y22", "Vivo Y16"] },
      { name: "T Series", slug: "vivo-t-series", models: ["Vivo T3", "Vivo T3 Pro", "Vivo T2 Pro", "Vivo T2"] },
    ],
  },
  {
    name: "Oppo", slug: "oppo", letter: "O", gradient: "from-green-500 to-teal-500", sort_order: 7,
    series: [
      { name: "Reno 11 Series", slug: "reno-11-series", models: ["Oppo Reno 11", "Oppo Reno 11 Pro", "Oppo Reno 11 Pro+"] },
      { name: "Reno 10 Series", slug: "reno-10-series", models: ["Oppo Reno 10", "Oppo Reno 10 Pro", "Oppo Reno 10 Pro+"] },
      { name: "Reno 8 Series", slug: "reno-8-series", models: ["Oppo Reno 8", "Oppo Reno 8 Pro", "Oppo Reno 8T"] },
      { name: "A Series", slug: "oppo-a-series", models: ["Oppo A78", "Oppo A58", "Oppo A38", "Oppo A18", "Oppo A17"] },
      { name: "F Series", slug: "oppo-f-series", models: ["Oppo F25 Pro", "Oppo F23", "Oppo F21 Pro"] },
    ],
  },
  {
    name: "Realme", slug: "realme", letter: "R", gradient: "from-yellow-400 to-orange-500", sort_order: 8,
    series: [
      { name: "Realme 12 Pro Series", slug: "realme-12-pro-series", models: ["Realme 12 Pro", "Realme 12 Pro+", "Realme 12x"] },
      { name: "Realme 11 Pro Series", slug: "realme-11-pro-series", models: ["Realme 11 Pro", "Realme 11 Pro+", "Realme 11x"] },
      { name: "Realme C Series", slug: "realme-c-series", models: ["Realme C65", "Realme C55", "Realme C35", "Realme C25Y"] },
      { name: "Narzo Series", slug: "narzo-series", models: ["Realme Narzo 70 Pro", "Realme Narzo 70", "Realme Narzo 60 Pro", "Realme Narzo 60"] },
      { name: "GT Series", slug: "realme-gt-series", models: ["Realme GT 6T", "Realme GT 6", "Realme GT 5 Pro"] },
    ],
  },
];

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function run() {
  const client = new Client({ connectionString: DB, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log("Connected to RDS");

  let brandCount = 0, seriesCount = 0, modelCount = 0;

  for (const brand of DATA) {
    const existing = await client.query(
      "SELECT id FROM brands WHERE slug = $1 AND service_type = 'mobile'",
      [brand.slug]
    );

    let brandId;
    if (existing.rows.length > 0) {
      brandId = existing.rows[0].id;
      console.log(`  Brand already exists: ${brand.name} (${brandId})`);
    } else {
      const res = await client.query(
        `INSERT INTO brands (name, slug, letter, gradient, sort_order, service_type)
         VALUES ($1, $2, $3, $4, $5, 'mobile') RETURNING id`,
        [brand.name, brand.slug, brand.letter, brand.gradient, brand.sort_order]
      );
      brandId = res.rows[0].id;
      brandCount++;
      console.log(`  Inserted brand: ${brand.name} (${brandId})`);
    }

    for (const s of brand.series) {
      const existingSeries = await client.query(
        "SELECT id FROM series WHERE brand_id = $1 AND slug = $2",
        [brandId, s.slug]
      );

      let seriesId;
      if (existingSeries.rows.length > 0) {
        seriesId = existingSeries.rows[0].id;
      } else {
        const sRes = await client.query(
          "INSERT INTO series (brand_id, name, slug) VALUES ($1, $2, $3) RETURNING id",
          [brandId, s.name, s.slug]
        );
        seriesId = sRes.rows[0].id;
        seriesCount++;
      }

      for (const modelName of s.models) {
        const modelSlug = slugify(modelName);
        const existingModel = await client.query(
          "SELECT id FROM models WHERE series_id = $1 AND slug = $2",
          [seriesId, modelSlug]
        );
        if (existingModel.rows.length === 0) {
          await client.query(
            "INSERT INTO models (series_id, name, slug) VALUES ($1, $2, $3)",
            [seriesId, modelName, modelSlug]
          );
          modelCount++;
        }
      }
    }
  }

  console.log(`\nDone! Inserted: ${brandCount} brands, ${seriesCount} series, ${modelCount} models`);
  await client.end();
}

run().catch((e) => { console.error(e); process.exit(1); });
