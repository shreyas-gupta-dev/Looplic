import pg from "pg";
const { Client } = pg;

const client = new Client({
  connectionString: "postgresql://looplic_admin:LooplcRDS2024X1@looplic-db.cduy2kcwyva7.ap-south-1.rds.amazonaws.com:5432/looplic",
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  const res = await client.query(`
    SELECT s.id, s.name, s.slug, s.image_url, b.name as brand_name, b.service_type
    FROM series s
    JOIN brands b ON s.brand_id = b.id
    WHERE b.service_type = 'mobile'
    ORDER BY b.name, s.name
  `);
  console.log(JSON.stringify(res.rows, null, 2));
  console.log(`\nTotal: ${res.rows.length} series`);
  const withImages = res.rows.filter(r => r.image_url);
  console.log(`With images: ${withImages.length}`);
  console.log(`Without images: ${res.rows.length - withImages.length}`);
  await client.end();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
