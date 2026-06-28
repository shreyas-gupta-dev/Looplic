import type { MetadataRoute } from "next";

import { blogPosts } from "@/src/lib/blog";
import { getCatalogSearchIndex } from "@/src/lib/data/catalog";
import { seoServicePages } from "@/src/lib/seo-service-pages";
import { bangaloreAreas, buildBangaloreAreaRoute, buildBangaloreAreaServiceRoute } from "@/src/lib/service-areas";
import { siteConfig } from "@/src/lib/site";

export const revalidate = 300;
export const dynamic = "force-dynamic";

type SitemapEntry = MetadataRoute.Sitemap[number];

type SearchIndex = Awaited<ReturnType<typeof getCatalogSearchIndex>>;

function toAbsoluteUrl(pathname: string) {
  return new URL(pathname, siteConfig.url).toString();
}

function createEntry(pathname: string, priority: number, changeFrequency: SitemapEntry["changeFrequency"]): SitemapEntry {
  return {
    url: toAbsoluteUrl(pathname),
    lastModified: new Date(),
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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [mobileIndex, laptopIndex] = await Promise.all([getCatalogSearchIndex("mobile"), getCatalogSearchIndex("laptop")]);

  const entries = [
    createEntry("/", 1, "daily"),
    createEntry("/bangalore", 0.8, "daily"),
    ...bangaloreAreas.map((area) => createEntry(buildBangaloreAreaRoute(area.slug), 0.7, "weekly")),
    ...bangaloreAreas.flatMap((area) => [
      createEntry(buildBangaloreAreaServiceRoute(area.slug, "mobile-repair"), 0.7, "weekly"),
      createEntry(buildBangaloreAreaServiceRoute(area.slug, "laptop-repair"), 0.7, "weekly"),
      createEntry(buildBangaloreAreaServiceRoute(area.slug, "cctv"), 0.7, "weekly"),
    ]),
    createEntry("/about-us", 0.4, "monthly"),
    createEntry("/contact-us", 0.5, "monthly"),
    createEntry("/privacy-policy", 0.2, "yearly"),
    createEntry("/terms-and-conditions", 0.2, "yearly"),
    createEntry("/blog", 0.6, "weekly"),
    ...blogPosts.map((post) => createEntry(`/blog/${post.slug}`, 0.6, "monthly")),
    createEntry("/service-pages", 0.7, "weekly"),
    createEntry("/brand-pages", 0.7, "weekly"),
    ...seoServicePages.map((page) => createEntry(`/${page.slug}`, 0.8, "weekly")),
    ...buildRepairEntries("mobile-repair", mobileIndex),
    ...buildRepairEntries("laptop-repair", laptopIndex),
  ];

  const deduped = new Map(entries.map((entry) => [entry.url, entry]));

  return [...deduped.values()];
}
