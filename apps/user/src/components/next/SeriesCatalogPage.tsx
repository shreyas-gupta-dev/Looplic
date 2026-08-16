"use client";

import { ChevronRight, Laptop, Smartphone } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { BrandLogo } from "@/src/components/next/BrandLogo";
import { CatalogPrefetchLink } from "@/src/components/next/CatalogPrefetchLink";
import type { CatalogBrand, CatalogSeries } from "@/src/lib/data/catalog";

// Series are stored with a trailing "Series" (e.g. "iPhone 11 Series") and often
// repeat the brand ("Apple iPhone 11 Series"). On the brand page the brand is
// already shown in the header, so strip a leading brand prefix and the trailing
// "Series" word for a cleaner, shorter label ("iPhone 11"). Fall back to the
// original name if stripping leaves nothing.
function formatSeriesLabel(name: string, brandName?: string) {
  let label = name.replace(/\s*series\s*$/i, "").trim();
  return label || name;
}

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
          <div className="min-w-0">
            <h1 className="text-lg font-semibold leading-tight text-foreground sm:text-2xl md:text-4xl">
              {brand.name} {deviceLabel} Series
            </h1>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
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
                className="group flex items-center rounded-2xl border border-border bg-card p-3 shadow-card-brand transition-all hover:border-primary/30 hover:shadow-elevated-brand active:scale-[0.98] sm:p-4"
              >
                <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                  <div className="flex size-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary sm:size-10">
                    {(series.image_url || brand.image_url) ? (
                      <img src={series.image_url || brand.image_url!} alt={series.name} className="size-full object-contain p-1" loading="lazy" />
                    ) : (
                      <DeviceIcon className="size-4 text-primary sm:size-5" />
                    )}
                  </div>
                  <span className="min-w-0 text-[13px] font-bold leading-snug text-foreground sm:text-sm">
                    {formatSeriesLabel(series.name, brand.name)}
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
