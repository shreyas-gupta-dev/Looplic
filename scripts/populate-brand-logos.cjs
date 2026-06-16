// Populates brands.image_url with a colored brand logo from a CDN
// (Google favicon service, 128px). Idempotent: only fills rows whose
// image_url is currently NULL or empty, unless RUN_FORCE=1.
//
//   node scripts/populate-brand-logos.cjs          # fill empties only
//   RUN_FORCE=1 node scripts/populate-brand-logos.cjs   # overwrite all
const { Client } = require("pg");

const DB =
  process.env.DATABASE_URL ||
  "postgresql://looplic_admin:LooplcRDS2024X1@looplic-db.cduy2kcwyva7.ap-south-1.rds.amazonaws.com:5432/looplic";

// brand slug -> official domain used for the logo lookup
const DOMAIN = {
  acer: "acer.com",
  apple: "apple.com",
  asus: "asus.com",
  avita: "avita.com",
  chuwi: "chuwi.com",
  dell: "dell.com",
  dynabook: "dynabook.com",
  framework: "frame.work",
  fujitsu: "fujitsu.com",
  gigabyte: "gigabyte.com",
  google: "store.google.com",
  honor: "hihonor.com",
  hp: "hp.com",
  huawei: "huawei.com",
  infinix: "infinixmobility.com",
  lenovo: "lenovo.com",
  lg: "lg.com",
  microsoft: "microsoft.com",
  msi: "msi.com",
  oneplus: "oneplus.com",
  oppo: "oppo.com",
  razer: "razer.com",
  realme: "realme.com",
  samsung: "samsung.com",
  vaio: "vaio.com",
  vivo: "vivo.com",
  xiaomi: "mi.com",
};

function logoUrl(domain) {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

(async () => {
  const force = process.env.RUN_FORCE === "1";
  const c = new Client({ connectionString: DB, ssl: { rejectUnauthorized: false } });
  await c.connect();

  const { rows } = await c.query("select id, name, slug, image_url from brands");
  let updated = 0;
  let skipped = 0;
  const missing = [];

  for (const b of rows) {
    const domain = DOMAIN[b.slug];
    if (!domain) {
      missing.push(b.slug);
      continue;
    }
    const hasImage = b.image_url && b.image_url.trim() !== "";
    if (hasImage && !force) {
      skipped++;
      continue;
    }
    await c.query("update brands set image_url = $1 where id = $2", [logoUrl(domain), b.id]);
    updated++;
  }

  console.log(`Brands updated: ${updated}, skipped (already had image): ${skipped}`);
  if (missing.length) console.log("No domain mapping for slugs:", missing.join(", "));
  await c.end();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
