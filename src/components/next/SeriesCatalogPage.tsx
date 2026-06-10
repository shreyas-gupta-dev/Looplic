"use client";

import { ChevronRight, Laptop, Smartphone } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { BrandLogo } from "@/src/components/next/BrandLogo";
import { CatalogPrefetchLink } from "@/src/components/next/CatalogPrefetchLink";
import type { CatalogBrand, CatalogSeries } from "@/src/lib/data/catalog";

type SeriesCatalogPageProps = {
  brand: CatalogBrand;
  seriesList: CatalogSeries[];
  brandsPath: string;
  seriesPathPrefix: string;
  serviceLabel: string;
  homeHref?: string;
};

export function SeriesCatalogPage({
  brand,
  seriesList,
  brandsPath,
  seriesPathPrefix,
  serviceLabel,
  homeHref = "/",
}: SeriesCatalogPageProps) {
  const DeviceIcon = brand.service_type === "laptop" ? Laptop : Smartphone;
  const deviceLabel = brand.service_type === "laptop" ? "Laptop" : "Phone";
  const [search, setSearch] = useState("");

  const filteredSeries = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return seriesList;
    }

    return seriesList.filter((series) => series.name.toLowerCase().includes(query));
  }, [search, seriesList]);

  return (
    <main className="flex-1">
      <div className="container py-6">
        <div className="mb-5 flex flex-wrap items-center gap-1 text-xs font-semibold text-muted-foreground">
          <Link href={homeHref} className="transition-colors hover:text-foreground">
            Home
          </Link>
          <ChevronRight className="size-3" />
          <Link href={brandsPath} className="transition-colors hover:text-foreground">
            Brands
          </Link>
          <ChevronRight className="size-3" />
          <span className="text-foreground">{brand.name}</span>
        </div>

        <div className="mb-6 flex items-center gap-4">
          <BrandLogo
            name={`${brand.name} logo`}
            imageUrl={brand.image_url}
            letter={brand.letter}
            gradient={brand.gradient}
            className="size-16 rounded-2xl border border-border object-contain shadow-card-brand"
            fallbackClassName="size-16 rounded-2xl shadow-sm"
          />
          <div>
            <h1 className="text-2xl font-semibold text-foreground md:text-4xl">{brand.name} {deviceLabel} Series</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Select your {brand.name} series to find {serviceLabel.toLowerCase()} services
            </p>
          </div>
        </div>

        <div className="relative mb-6 max-w-sm">
          <input
            type="text"
            placeholder={`Search ${brand.name} series...`}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {filteredSeries.length === 0 ? (
          <div className="py-16 text-center">
            <DeviceIcon className="mx-auto mb-3 size-10 text-muted-foreground/30" />
            <p className="text-sm font-semibold text-muted-foreground">
              {search ? `No ${brand.name} series match your search` : `No series available for ${brand.name}`}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{search ? "Try a different series name." : "Check back soon!"}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {filteredSeries.map((series) => (
              <CatalogPrefetchLink
                key={series.id}
                href={`${seriesPathPrefix}/${series.slug}`}
                eagerPrefetch={!search}
                className="group flex items-center rounded-2xl border border-border bg-card p-4 shadow-card-brand transition-all hover:border-primary/30 hover:shadow-elevated-brand active:scale-[0.98]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-10 flex-shrink-0 items-center justify-center rounded-xl bg-secondary">
                    <DeviceIcon className="size-5 text-primary" />
                  </div>
                  <span className="whitespace-normal break-words text-sm font-bold leading-tight text-foreground">
                    {series.name}
                  </span>
                </div>
              </CatalogPrefetchLink>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
