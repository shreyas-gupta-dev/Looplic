// One-off importer: converts the legacy hardcoded posts in
// apps/user/src/lib/blog.ts into rows in the new blog_posts CMS table.
//
// The static posts use a rich structured shape (summary, sections, checklist,
// comparison table, CTA...). We flatten that into a single body_html so the
// content is editable in Admin -> Blog going forward. Cover images are left
// empty (the legacy design used gradients, not photos) for staff to add.
//
// Idempotent: ON CONFLICT (slug) DO NOTHING, so re-running never clobbers edits
// made in the admin editor. Delete a row first if you want to re-import it.
//
// Usage:
//   DATABASE_URL=postgresql://user:pass@host:5432/looplic node scripts/import-blog-posts.cjs
const path = require("path");
const os = require("os");
const fs = require("fs");
const { Client } = require("pg");
const esbuild = require("esbuild");

const DB = process.env.DATABASE_URL;
if (!DB) {
  console.error("Set DATABASE_URL to the RDS connection string before running.");
  process.exit(1);
}

const USER_APP = path.resolve(__dirname, "../apps/user");
const BLOG_TS = path.join(USER_APP, "src/lib/blog.ts");

// Bundle blog.ts (TS + "@/..." alias) into a temp CJS module we can require,
// so we import the real exported data instead of duplicating it here.
function loadBlogPosts() {
  const outfile = path.join(os.tmpdir(), `looplic-blog-${Date.now()}.cjs`);
  esbuild.buildSync({
    entryPoints: [BLOG_TS],
    outfile,
    bundle: true,
    platform: "node",
    format: "cjs",
    alias: { "@": USER_APP },
    logLevel: "warning",
  });
  const mod = require(outfile);
  fs.unlinkSync(outfile);
  return mod.blogPosts;
}

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

// Turn one structured legacy post into a single HTML body.
function toHtml(post) {
  const parts = [];

  if (Array.isArray(post.summary) && post.summary.length) {
    parts.push("<h2>What you will learn</h2>");
    parts.push("<ul>" + post.summary.map((s) => `<li>${esc(s)}</li>`).join("") + "</ul>");
  }

  for (const section of post.sections || []) {
    parts.push(`<h2>${esc(section.title)}</h2>`);
    for (const p of section.body || []) parts.push(`<p>${esc(p)}</p>`);
    if (section.bullets && section.bullets.length) {
      parts.push("<ul>" + section.bullets.map((b) => `<li>${esc(b)}</li>`).join("") + "</ul>");
    }
  }

  if (post.comparisonTable) {
    const t = post.comparisonTable;
    parts.push(`<h2>${esc(t.title)}</h2>`);
    if (t.description) parts.push(`<p>${esc(t.description)}</p>`);
    const head = ["Provider", ...(t.columns || [])].map((c) => `<th>${esc(c)}</th>`).join("");
    const rows = (t.rows || [])
      .map((r) => {
        const provider = r.provider?.href
          ? `<a href="${esc(r.provider.href)}">${esc(r.provider.label)}</a>`
          : esc(r.provider?.label);
        const cells = (r.cells || []).map((c) => `<td>${esc(c)}</td>`).join("");
        return `<tr><td>${provider}</td>${cells}</tr>`;
      })
      .join("");
    parts.push(`<table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`);
  }

  if (Array.isArray(post.takeaways) && post.takeaways.length) {
    parts.push("<h2>Key takeaways</h2>");
    parts.push("<ul>" + post.takeaways.map((t) => `<li>${esc(t)}</li>`).join("") + "</ul>");
  }

  if (Array.isArray(post.checklist) && post.checklist.length) {
    parts.push("<h2>Repair checklist</h2>");
    parts.push("<ul>" + post.checklist.map((c) => `<li>${esc(c)}</li>`).join("") + "</ul>");
  }

  const links = [...(post.internalLinks || []), ...(post.externalLinks || [])];
  if (links.length) {
    parts.push("<h2>Helpful links</h2>");
    parts.push("<ul>" + links.map((l) => `<li><a href="${esc(l.href)}">${esc(l.label)}</a></li>`).join("") + "</ul>");
  }

  if (post.cta) {
    parts.push(`<h2>${esc(post.cta.title)}</h2>`);
    parts.push(`<p>${esc(post.cta.description)}</p>`);
    if (post.cta.primaryHref) {
      parts.push(`<p><a href="${esc(post.cta.primaryHref)}">${esc(post.cta.primaryLabel)}</a></p>`);
    }
  }

  return parts.join("\n");
}

async function main() {
  const posts = loadBlogPosts();
  console.log(`Loaded ${posts.length} legacy post(s) from blog.ts`);

  const client = new Client({
    connectionString: DB,
    ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
  });
  await client.connect();

  let inserted = 0;
  let skipped = 0;
  for (const post of posts) {
    const bodyHtml = toHtml(post);
    const res = await client.query(
      `INSERT INTO blog_posts
         (slug, title, excerpt, body_html, cover_image_alt, status, published_at,
          author, category, tags, reading_time, seo_title, seo_description, updated_at)
       VALUES ($1,$2,$3,$4,$5,'published',$6,$7,$8,$9,$10,$11,$12,$13)
       ON CONFLICT (slug) DO NOTHING`,
      [
        post.slug,
        post.title,
        post.excerpt || "",
        bodyHtml,
        post.heroAlt || "",
        post.publishedAt ? new Date(post.publishedAt) : null,
        post.author || "",
        post.category || "",
        post.keywords || [],
        post.readingTime || "",
        post.title || "",
        post.description || post.excerpt || "",
        post.updatedAt ? new Date(post.updatedAt) : new Date(),
      ],
    );
    if (res.rowCount > 0) {
      inserted++;
      console.log(`  + ${post.slug}`);
    } else {
      skipped++;
      console.log(`  = ${post.slug} (already exists, skipped)`);
    }
  }

  await client.end();
  console.log(`\nDone. Inserted ${inserted}, skipped ${skipped}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
