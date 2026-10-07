import type { MetadataRoute } from "next";

import { blogPosts } from "@/src/lib/blog";
import { getCatalogSearchIndex } from "@/src/lib/data/catalog";
import { seoServicePages } from "@/src/lib/seo-service-pages";
import { bangaloreAreas, buildBangaloreAreaRoute, buildBangaloreAreaServiceRoute } from "@/src/lib/service-areas";
import { siteConfig } from "@/src/lib/site";

// ISR: regenerate at most every 5 minutes. Previously force-dynamic, which
// rebuilt the sitemap on every request and is unnecessary for content that
// changes slowly.
export const revalidate = 300;

type SitemapEntry = MetadataRoute.Sitemap[number];

type SearchIndex = Awaited<ReturnType<typeof getCatalogSearchIndex>>;

function toAbsoluteUrl(pathname: string) {
  return new URL(pathname, siteConfig.url).toString();
}

// lastModified is only emitted when we have a real content date (e.g. a blog
// post's updatedAt). Stamping every URL with `new Date()` on each render is a
// fake freshness signal that crawlers learn to distrust, so we omit it instead.
function createEntry(
  pathname: string,
  priority: number,
  changeFrequency: SitemapEntry["changeFrequency"],
  lastModified?: Date,
): SitemapEntry {
  return {
    url: toAbsoluteUrl(pathname),
    ...(lastModified ? { lastModified } : {}),
    changeFrequency,
    priority,
  };
}

function buildRepairEntries(
  serviceType: "mobile-repair" | "laptop-repair",
  searchIndex: SearchIndex,
) {
  const basePath = `/service/${serviceType}`;

  return [
    createEntry(basePath, 0.8, "daily"),
    createEntry(`${basePath}/brands`, 0.7, "daily"),
    ...searchIndex.brands.map((brand) => createEntry(`${basePath}/brands/${brand.slug}`, 0.7, "daily")),
    ...searchIndex.series.map((series) => createEntry(`${basePath}/brands/${series.brand_slug}/${series.slug}`, 0.6, "daily")),
    ...searchIndex.models.map((model) => createEntry(`${basePath}/book/${model.brand_slug}/${model.series_slug}/${model.slug}`, 0.7, "daily")),
  ];
}

function buildSellEntries(category: "phone" | "laptop" | "tablet" | "smartwatch" | "audio", searchIndex: SearchIndex) {
  const basePath = `/sell/${category}`;

  return [
    createEntry("/sell", 0.9, "daily"),
    createEntry(basePath, 0.7, "daily"),
    ...searchIndex.brands.map((brand) => createEntry(`${basePath}/${brand.slug}`, 0.6, "daily")),
    ...searchIndex.series.map((series) => createEntry(`${basePath}/${series.brand_slug}/${series.slug}`, 0.5, "daily")),
    ...searchIndex.models.map((model) => createEntry(`${basePath}/${model.brand_slug}/${model.series_slug}/${model.slug}`, 0.6, "daily")),
  ];
}

import { db } from "@/src/lib/db";
import { products } from "@/src/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [mobileIndex, laptopIndex, tabletIndex, smartwatchIndex, audioIndex, productRows] = await Promise.all([
    getCatalogSearchIndex("mobile"),
    getCatalogSearchIndex("laptop"),
    getCatalogSearchIndex("tablet"),
    getCatalogSearchIndex("smartwatch"),
    getCatalogSearchIndex("audio"),
    db.select({ slug: products.slug, updatedAt: products.updatedAt }).from(products).where(eq(products.active, true)).catch(() => []),
  ]);

  const entries = [
    createEntry("/", 1, "daily"),
    createEntry("/buy", 0.9, "daily"),
    ...productRows.map((p) => createEntry(`/buy/${p.slug}`, 0.8, "daily", p.updatedAt ? new Date(p.updatedAt) : undefined)),
    createEntry("/bangalore", 0.8, "daily"),
    ...bangaloreAreas.map((area) => createEntry(buildBangaloreAreaRoute(area.slug), 0.7, "weekly")),
    ...bangaloreAreas.flatMap((area) => [
      createEntry(buildBangaloreAreaServiceRoute(area.slug, "mobile-repair"), 0.7, "weekly"),
      createEntry(buildBangaloreAreaServiceRoute(area.slug, "laptop-repair"), 0.7, "weekly"),
      createEntry(buildBangaloreAreaServiceRoute(area.slug, "cctv"), 0.7, "weekly"),
    ]),
    createEntry("/about-us", 0.5, "monthly"),
    createEntry("/careers", 0.5, "monthly"),
    createEntry("/faq", 0.6, "weekly"),
    createEntry("/contact-us", 0.5, "monthly"),
    createEntry("/partners", 0.5, "monthly"),
    createEntry("/store-locator", 0.6, "monthly"),
    createEntry("/privacy-policy", 0.3, "yearly"),
    createEntry("/terms-and-conditions", 0.3, "yearly"),
    createEntry("/refund-policy", 0.4, "yearly"),
    createEntry("/buyback-policy", 0.5, "monthly"),
    createEntry("/warranty-policy", 0.5, "monthly"),
    // High-priority Bangalore Google Ads & SEO landing routes
    createEntry("/sell-old-mobile-phone-bangalore", 0.9, "daily"),
    createEntry("/sell-old-laptop-bangalore", 0.9, "daily"),
    createEntry("/sell-old-iphone-bangalore", 0.9, "daily"),
    createEntry("/refurbished-phones-bangalore", 0.9, "daily"),
    createEntry("/refurbished-iphones-bangalore", 0.9, "daily"),
    createEntry("/mobile-repair-bangalore", 0.9, "daily"),
    createEntry("/iphone-repair-bangalore", 0.9, "daily"),
    createEntry("/samsung-repair-bangalore", 0.9, "daily"),
    createEntry("/laptop-repair-bangalore", 0.9, "daily"),
    createEntry("/cctv-installation-bangalore", 0.9, "daily"),
    createEntry("/blog", 0.6, "weekly"),
    ...blogPosts.map((post) => createEntry(`/blog/${post.slug}`, 0.6, "monthly", new Date(post.updatedAt))),
    // /service-pages and /brand-pages are noindex,follow URL-index pages — they
    // stay crawlable via the footer but are intentionally excluded from the sitemap.
    ...seoServicePages.map((page) => createEntry(`/${page.slug}`, 0.8, "weekly")),
    ...buildRepairEntries("mobile-repair", mobileIndex),
    ...buildRepairEntries("laptop-repair", laptopIndex),
    ...buildSellEntries("phone", mobileIndex),
    ...buildSellEntries("laptop", laptopIndex),
    ...buildSellEntries("tablet", tabletIndex),
    ...buildSellEntries("smartwatch", smartwatchIndex),
    ...buildSellEntries("audio", audioIndex),
    createEntry("/sell/corporate", 0.6, "weekly"),
  ];

  const deduped = new Map(entries.map((entry) => [entry.url, entry]));

  return [...deduped.values()];
}
