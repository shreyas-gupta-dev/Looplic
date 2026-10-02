const { Client } = require("pg");
const fs = require("fs");

async function main() {
  const env = fs.readFileSync("apps/user/.env.local", "utf8");
  const dbUrl = env.match(/DATABASE_URL=(.*)/)[1].trim();

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  console.log("Connected to RDS PostgreSQL");

  // Query 1: Brand lookup
  console.log("\n1. Looking up brand 'apple' for 'mobile':");
  const brandRes = await client.query(
    "SELECT id, name, slug, letter, gradient, image_url, service_type FROM brands WHERE service_type = $1 AND slug = $2",
    ["mobile", "apple"]
  );
  console.log("Brand found:", brandRes.rows);

  if (brandRes.rows.length === 0) {
    console.log("No exact match. Looking up all mobile brands with slug or name like apple:");
    const allApple = await client.query(
      "SELECT id, name, slug, service_type FROM brands WHERE name ILIKE '%apple%' OR slug ILIKE '%apple%'"
    );
    console.log("Apple rows in DB:", allApple.rows);
  }

  const brand = brandRes.rows[0];
  if (brand) {
    console.log("\n2. Looking up series for brand id:", brand.id);
    const seriesRes = await client.query(
      "SELECT id, brand_id, name, slug, image_url FROM series WHERE brand_id = $1 ORDER BY name",
      [brand.id]
    );
    console.log(`Found ${seriesRes.rows.length} series for ${brand.name}:`);
    console.log(seriesRes.rows.slice(0, 5));
  }

  await client.end();
}

main().catch(console.error);
