const { Client } = require("pg");

const DB = "postgresql://looplic_admin:LooplcRDS2024X1@looplic-db.cduy2kcwyva7.ap-south-1.rds.amazonaws.com:5432/looplic";
const APPLE_ID = "bd600892-a960-4cdf-9992-20117924592f";
const SAMSUNG_ID = "eb0a7123-e441-48a7-a3dc-1028f054b9d2";
const ONEPLUS_ID = "6bf8a034-8656-4682-858f-82485571537c";
const XIAOMI_ID = "92591da5-c801-491e-9d52-6205a4ba5976";

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const NEW_SERIES = [
  // Apple - older series missing from first seed
  {
    brandId: APPLE_ID,
    name: "iPhone 6 Series",
    slug: "iphone-6-series",
    models: ["iPhone 6", "iPhone 6 Plus", "iPhone 6S", "iPhone 6S Plus"],
  },
  {
    brandId: APPLE_ID,
    name: "iPhone 7 Series",
    slug: "iphone-7-series",
    models: ["iPhone 7", "iPhone 7 Plus"],
  },
  {
    brandId: APPLE_ID,
    name: "iPhone 8 Series",
    slug: "iphone-8-series",
    models: ["iPhone 8", "iPhone 8 Plus"],
  },
  {
    brandId: APPLE_ID,
    name: "iPhone 17 Series",
    slug: "iphone-17-series",
    models: ["iPhone 17", "iPhone 17 Plus", "iPhone 17 Pro", "iPhone 17 Pro Max", "iPhone 17e"],
  },
  {
    brandId: APPLE_ID,
    name: "iPhone Air",
    slug: "iphone-air",
    models: ["iPhone Air"],
  },
  // Samsung - add more A and M models
  {
    brandId: SAMSUNG_ID,
    name: "Galaxy S25 Series",
    slug: "galaxy-s25-series",
    models: ["Galaxy S25", "Galaxy S25+", "Galaxy S25 Ultra", "Galaxy S25 Edge"],
  },
  // OnePlus - add newer models
  {
    brandId: ONEPLUS_ID,
    name: "OnePlus 13 Series",
    slug: "oneplus-13-series",
    models: ["OnePlus 13", "OnePlus 13R"],
  },
  {
    brandId: ONEPLUS_ID,
    name: "OnePlus Nord CE 4",
    slug: "oneplus-nord-ce-4",
    models: ["OnePlus Nord CE 4", "OnePlus Nord CE 4 Lite"],
  },
  {
    brandId: ONEPLUS_ID,
    name: "OnePlus Nord 4 Series",
    slug: "oneplus-nord-4-series",
    models: ["OnePlus Nord 4"],
  },
];

// Models to add to existing series
const EXISTING_SERIES_ADDITIONS = [
  // Add iPhone SE 1st gen to the iPhone SE series
  { brandId: APPLE_ID, seriesSlug: "iphone-se", models: ["iPhone SE (1st Gen)"] },
  // Add iPhone 16e to iPhone 16 series
  { brandId: APPLE_ID, seriesSlug: "iphone-16-series", models: ["iPhone 16e"] },
];

async function run() {
  const client = new Client({ connectionString: DB, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log("Connected");

  let seriesCount = 0, modelCount = 0;

  // Insert new series + models
  for (const s of NEW_SERIES) {
    const existing = await client.query(
      "SELECT id FROM series WHERE brand_id = $1 AND slug = $2",
      [s.brandId, s.slug]
    );

    let seriesId;
    if (existing.rows.length > 0) {
      seriesId = existing.rows[0].id;
      console.log(`  Series already exists: ${s.name}`);
    } else {
      const res = await client.query(
        "INSERT INTO series (brand_id, name, slug) VALUES ($1, $2, $3) RETURNING id",
        [s.brandId, s.name, s.slug]
      );
      seriesId = res.rows[0].id;
      seriesCount++;
      console.log(`  Added series: ${s.name}`);
    }

    for (const modelName of s.models) {
      const modelSlug = slugify(modelName);
      const ex = await client.query(
        "SELECT id FROM models WHERE series_id = $1 AND slug = $2",
        [seriesId, modelSlug]
      );
      if (ex.rows.length === 0) {
        await client.query(
          "INSERT INTO models (series_id, name, slug) VALUES ($1, $2, $3)",
          [seriesId, modelName, modelSlug]
        );
        modelCount++;
      }
    }
  }

  // Add models to existing series
  for (const item of EXISTING_SERIES_ADDITIONS) {
    const sRes = await client.query(
      "SELECT id FROM series WHERE brand_id = $1 AND slug = $2",
      [item.brandId, item.seriesSlug]
    );
    if (sRes.rows.length === 0) {
      console.log(`  Series not found: ${item.seriesSlug}`);
      continue;
    }
    const seriesId = sRes.rows[0].id;
    for (const modelName of item.models) {
      const modelSlug = slugify(modelName);
      const ex = await client.query(
        "SELECT id FROM models WHERE series_id = $1 AND slug = $2",
        [seriesId, modelSlug]
      );
      if (ex.rows.length === 0) {
        await client.query(
          "INSERT INTO models (series_id, name, slug) VALUES ($1, $2, $3)",
          [seriesId, modelName, modelSlug]
        );
        modelCount++;
        console.log(`  Added model: ${modelName}`);
      }
    }
  }

  const countRes = await client.query(
    "SELECT COUNT(*) as cnt FROM models m JOIN series s ON m.series_id = s.id JOIN brands b ON s.brand_id = b.id WHERE b.service_type = 'mobile'"
  );
  console.log(`\nDone! Added: ${seriesCount} series, ${modelCount} models`);
  console.log(`Total mobile models in DB: ${countRes.rows[0].cnt}`);
  await client.end();
}

run().catch(e => { console.error(e.message); process.exit(1); });
