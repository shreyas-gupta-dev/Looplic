import type { Metadata } from "next";

import { CatalogNavbar } from "@/src/components/next/CatalogNavbar";
import { HomepageFooter } from "@/src/components/next/HomepageFooter";
import { getBrandsForListing, getSeriesForBrand } from "@/src/lib/data/catalog";
import { buildPageMetadata } from "@/src/lib/metadata";
import { siteConfig } from "@/src/lib/site";

export const revalidate = 300;

export const metadata: Metadata = buildPageMetadata({
  title: "Looplic Brand Page URLs",
  description: "Plain URL index for Looplic mobile and laptop brand and series pages in Bangalore. Model booking URLs are excluded.",
  pathname: "/brand-pages",
  keywords: ["Looplic brand URLs", "mobile repair brand pages", "laptop repair brand pages"],
  noIndex: true,
});

type BrandUrlEntry = {
  href: string;
  label: string;
};

async function getBrandUrlEntries() {
  const configs = [
    { serviceType: "mobile-repair", listingType: "mobile" as const, label: "Mobile Repair" },
    { serviceType: "laptop-repair", listingType: "laptop" as const, label: "Laptop Repair" },
  ];

  const entries = await Promise.all(
    configs.map(async (config) => {
      const brands = await getBrandsForListing(config.listingType);
      const brandEntries: BrandUrlEntry[] = brands.map((brand) => ({
        href: `/service/${config.serviceType}/brands/${brand.slug}`,
        label: `${brand.name} ${config.label}`,
      }));

      const seriesGroups = await Promise.all(
        brands.map(async (brand) => {
          const seriesList = await getSeriesForBrand(brand.id);
          return seriesList.map((series) => ({
            href: `/service/${config.serviceType}/brands/${brand.slug}/${series.slug}`,
            label: `${brand.name} ${series.name} ${config.label}`,
          }));
        }),
      );

      return [
        {
          href: `/service/${config.serviceType}/brands`,
          label: `${config.label} brands`,
        },
        ...brandEntries,
        ...seriesGroups.flat(),
      ];
    }),
  );

  return entries.flat();
}

export default async function BrandPagesIndex() {
  const entries = await getBrandUrlEntries();

  return (
    <div className="min-h-screen bg-background">
      <CatalogNavbar />
      <main className="container max-w-5xl py-10">
        <h1 className="text-3xl font-semibold text-foreground">Brand page URLs</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Mobile and laptop brand and series URLs only. Model-level booking URLs are intentionally excluded.
        </p>

        <section className="mt-8">
          <ul className="grid gap-3 text-sm font-semibold">
            {entries.map((entry) => {
              const absoluteUrl = new URL(entry.href, siteConfig.url).toString();

              return (
                <li key={entry.href} className="break-all rounded-xl border border-border bg-card p-3">
                  <a href={entry.href} className="text-primary underline-offset-4 hover:underline">
                    {absoluteUrl}
                  </a>
                  <div className="mt-1 text-xs text-muted-foreground">{entry.label}</div>
                </li>
              );
            })}
          </ul>
        </section>
      </main>
      <HomepageFooter />
    </div>
  );
}
