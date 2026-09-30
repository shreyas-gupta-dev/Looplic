const { Client } = require('pg');
const fs = require('fs');

const BRAND_IMAGE_MAP = {
  apple: '/images/brands/apple.png',
  samsung: '/images/brands/samsung.png',
  oneplus: '/images/brands/oneplus.png',
  xiaomi: '/images/brands/xiaomi.png',
  google: '/images/brands/google.png',
  vivo: '/images/brands/vivo.png',
  oppo: '/images/brands/oppo.png',
  realme: '/images/brands/realme.png',
  huawei: '/images/brands/huawei.svg',
  micromax: '/images/brands/micromax.svg',
  lava: '/images/brands/lava.svg',
  motorola: '/images/brands/motorola.png',
  lenovo: '/images/brands/lenovo.png',
  nokia: '/images/brands/nokia.png',
  honor: '/images/brands/honor.png',
  asus: '/images/brands/asus.png',
  lg: '/images/brands/lg.png',
  infinix: '/images/brands/infinix.png',
  tecno: '/images/brands/tecno.png',
  iqoo: '/images/brands/iqoo.png',
  nothing: '/images/brands/nothing.png',
  poco: '/images/brands/poco.png',
  dell: '/images/brands/dell.svg',
  hp: '/images/brands/hp.svg',
  acer: '/images/brands/acer.svg',
  msi: '/images/brands/msi.png',
  microsoft: '/images/brands/microsoft.svg',
  razer: '/images/brands/razer.svg',
  gigabyte: '/images/brands/gigabyte.svg',
  framework: '/images/brands/framework.svg',
  dynabook: '/images/brands/dynabook.svg',
  fujitsu: '/images/brands/fujitsu.svg',
  avita: '/images/brands/avita.png',
  vaio: '/images/brands/vaio.png',
  chuwi: '/images/brands/chuwi.png',
};

function normalizeKey(slugOrName) {
  return slugOrName
    .toLowerCase()
    .trim()
    .replace(/-laptop$/, '')
    .replace(/\s+laptop$/, '')
    .replace(/[^a-z0-9]/g, '');
}

async function main() {
  const env = fs.readFileSync('apps/user/.env.local', 'utf8');
  const dbUrl = env.match(/DATABASE_URL=(.*)/)[1].trim().replace(/^['"]|['"]$/g, '');
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const brandsRes = await client.query('SELECT id, name, slug, image_url FROM brands');
  console.log(`Found ${brandsRes.rows.length} brand rows in database.`);

  let updatedCount = 0;
  for (const b of brandsRes.rows) {
    const key = normalizeKey(b.slug) || normalizeKey(b.name);
    const targetUrl = BRAND_IMAGE_MAP[key];
    if (targetUrl && b.image_url !== targetUrl) {
      await client.query('UPDATE brands SET image_url = $1 WHERE id = $2', [targetUrl, b.id]);
      console.log(`Updated ${b.name} (${b.slug}) -> ${targetUrl}`);
      updatedCount++;
    }
  }

  console.log(`Successfully updated ${updatedCount} brand rows in database.`);
  await client.end();
}

main().catch(console.error);
