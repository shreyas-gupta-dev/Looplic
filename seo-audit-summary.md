# Looplic SEO Audit — Before / After Summary

Site: https://www.looplic.com (canonical) — Next.js App Router, `apps/user`.
Scope: full technical + on-page SEO audit and fixes across 7 phases.

Status: **SHIPPED & VERIFIED LIVE** via PR #28 (main pass) + PR #29 (homepage cacheable).

## Verified in production (post-deploy)
- Caching (live `Cache-Control`):
  - `/mi-screen-replacement`, `/service/cctv`, `/blog` → `s-maxage=31536000` (static, cacheable)
  - `/`, `/service/mobile-repair`, brand catalog → `s-maxage=300, stale-while-revalidate` (ISR)
  - `/account`, `/thank-you` → `no-store` (correctly uncacheable)
- Schema present on live: FAQPage (landings), Organization (site-wide), BreadcrumbList (catalog).
- Indexability: `/service-pages`, `/thank-you` serve `noindex, follow`; canonicals self-referencing.
- robots.txt: `Disallow: /api/` on Googlebot/Bingbot/*. Sitemap: 2,656 URLs, 100% www-canonical,
  0 noindexed URL-index pages.
- OAuth: `/?code=` → 307 → `/auth/callback` via middleware (login intact after H3 change).

## Deliverables
- Updated codebase (this branch)
- `apps/user/app/sitemap.ts` — dynamic sitemap (ISR), noindex pages excluded
- `seo-metadata-audit.csv` — per-page title/description audit + final copy
- `seo-internal-linking-map.md` — link graph + applied changes
- `seo-audit-summary.md` — this file

## Before → After

### Performance / crawl
- **Site-wide `no-store`** on every HTML page → **scoped** to per-user pages only
  (`/account`, `/thank-you`, `/auth/*`, `/book/*`, `/service/*/book/*`). Marketing/
  catalog pages are now edge-cacheable (LCP/TTFB win). Booking stale-profile
  protection retained.
- **Sitemap** `force-dynamic` + faked `lastModified: new Date()` on every URL →
  ISR (`revalidate=300`); `lastModified` only on blog posts (real `updatedAt`).

### Structure / semantics
- Bare `<nav>` top bars → proper `<header>` + `<nav aria-label="Primary">`
  landmarks (HomepageNavbar, CatalogNavbar).
- Broken-link crawl: **0 broken internal links / 404s** found.
- Booking-flow multiple `<h1>`: verified conditional (one per step) — non-issue.

### Metadata (8 pages fixed; all titles <=60c, descriptions ~150-160c)
- Home title 76c→54c, desc 195c→154c.
- `/service/cctv` title 84c (with a stray `|` breaking the SERP title)→55c.
- `/service/cctv/brands` double-brand title→32c; desc padded.
- `/about-us`, `/contact-us` redundant "X | Looplic"→"About Us"/"Contact Us".
- `/blog` generic title→keyworded; desc padded.
- 12 brand screen-replacement descriptions (shared template) 187c→148-158c.
- `/iphone-screen-replacement` desc 163c→156c.

### Internal linking
- Added crawlable "Popular screen replacements" hub section on
  `/service/mobile-repair` → all 13 landings now 1 click from a hub.
- Reciprocal catalog→landing links on mobile brand pages.
- `/iphone-screen-replacement` joined the sibling cluster.
- No orphan indexable pages.

### Schema (structured data)
- Already present: LocalBusiness (home), Service (service pages), BlogPosting (blog).
- **Added FAQPage** to all 13 landing pages (FAQ rich-result eligible).
- **Added Organization** site-wide (logo, sameAs socials, contactPoint).
- **Added BreadcrumbList** to brand → series → model catalog pages.

### Indexability
- `/thank-you`, `/service-pages`, `/brand-pages` → `noindex,follow`
  (+ removed the two URL-index pages from the sitemap).
- `buildPageMetadata` noindex now uses `follow:true` (was dead-ending crawl).
- robots.txt: `Disallow: /api/` added to Googlebot, Bingbot, and `*` groups.
- Self-referencing canonicals verified on every page.

## Open item (infra, not code)
- ~~**Apex→www redirect is a 302 at CloudFront**~~ **FIXED 2026-07-16**: the Amplify
  app's custom rule (`https://looplic.com` → `https://www.looplic.com`) was changed
  from 302 to **301**. Verified live: apex returns 301 with path+query preserved.

## Google Search Console (Phase 7) — your action
1. GSC → Add property → **Domain** → enter `looplic.com`.
2. Copy the `google-site-verification=...` TXT value Google shows.
3. Route53 → `looplic.com` hosted zone → create a **TXT** record on the apex
   (name blank/`@`), value = the quoted string from step 2, TTL 300.
4. Wait for propagation, click **Verify** in GSC.
5. GSC → Sitemaps → submit `https://www.looplic.com/sitemap.xml`.