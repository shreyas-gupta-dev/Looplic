# Looplic — Internal Linking Map

## Hubs
- **Homepage `/`** — top authority. Nav + footer on every page.
- **`/service/mobile-repair`** — topical hub for mobile screen-replacement cluster.
- **`/service/laptop-repair`**, **`/service/cctv`**, IT/desktop service pages — secondary hubs.

## Global links (every page)
- **Nav:** `/`, `/service/mobile-repair/brands`, `/about-us`, `/contact-us`
- **Footer:** `/bangalore`, `/service/mobile-repair`, `/samsung-screen-replacement`, `/blog`, `/about-us`, `/contact-us`, `/privacy-policy`, `/terms-and-conditions`

## Catalog chain (crawlable)
`/service/[type]` → `/service/[type]/brands` → `/service/[type]/brands/[brand]` → `[series]` → `book/.../[model]`
- Each level renders `CrawlableInternalLinks` to siblings/children.

## Screen-replacement cluster (13 landing pages)
- 12 generated landings cross-link all 11 siblings via `brandLinks`.
- `/iphone-screen-replacement` (manual) — **now joined to the cluster** (added `brandLinks`).
- Blog posts link to iPhone / Samsung / OnePlus landings.
- `/service-pages` lists all 13 (URL index).

## Changes applied this phase
1. **P1 — Hub entry:** `/service/mobile-repair` now renders a crawlable
   "Popular screen replacements in Bangalore" section linking all 13 landings.
   → every landing is now **1 click from a hub** (was 2, behind a thin URL list).
2. **P3 — Reciprocal links:** each mobile brand catalog page
   (`/service/mobile-repair/brands/[brand]`) now links to its matching
   `*-screen-replacement` landing (via `screenReplacementLandingByBrandSlug`).
3. **iPhone cluster fix:** `/iphone-screen-replacement` linked into the sibling cluster.

## Flagged (not changed)
- Potential keyword overlap between `/iphone-screen-replacement` and
  `/apple-iphone-screen-replacement` — both kept live per decision; monitor in GSC.
- `/service-pages` and `/brand-pages` URL-index pages — indexability decision deferred to Phase 6.

## Orphan check
No orphan indexable pages remain: every indexable route is reachable from a hub,
the global nav/footer, the catalog chain, or the screen-replacement cluster.
