const { Client } = require('pg');
const DB_URL = process.env.DATABASE_URL || '';

async function checkImages() {
  const pg = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  await pg.connect();
  
  const brands = await pg.query("SELECT count(*) FROM brands WHERE image_url LIKE '%amazonaws.com%'");
  const models = await pg.query("SELECT count(*) FROM models WHERE image_url LIKE '%amazonaws.com%'");
  const series = await pg.query("SELECT count(*) FROM series WHERE image_url LIKE '%amazonaws.com%'");
  const products = await pg.query("SELECT count(*) FROM products WHERE cover_image_url LIKE '%amazonaws.com%'");
  const prodImg = await pg.query("SELECT count(*) FROM product_images WHERE image_url LIKE '%amazonaws.com%'");
  
  console.log('AWS S3 Image URLs in Database:');
  console.log('- brands.logo_url with S3:', brands.rows[0].count);
  console.log('- models.image_url with S3:', models.rows[0].count);
  console.log('- series.image_url with S3:', series.rows[0].count);
  console.log('- products.image_url with S3:', products.rows[0].count);
  console.log('- product_images.image_url with S3:', prodImg.rows[0].count);

  const localImgs = await pg.query("SELECT count(*) FROM models WHERE image_url LIKE '/images/%' OR image_url LIKE '/brand/%'");
  console.log('- models.image_url with local first-party assets:', localImgs.rows[0].count);

  const totalModels = await pg.query("SELECT count(*) FROM models");
  console.log('- Total models:', totalModels.rows[0].count);

  await pg.end();
}

checkImages().catch(console.error);
