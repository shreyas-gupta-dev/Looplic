"use client";

import { ChevronRight, Smartphone } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { BrandLogo } from "@/src/components/next/BrandLogo";
import { CatalogPrefetchLink } from "@/src/components/next/CatalogPrefetchLink";
import type { CatalogBrand, CatalogSeries } from "@/src/lib/data/catalog";

// Series are stored with a trailing "Series" (e.g. "iPhone 11 Series"), but the
// brand-page cards read cleaner without it ("iPhone 11"). Strip only a trailing
// "Series" word and fall back to the original name if nothing is left.
function formatSeriesLabel(name: string) {
  return name.replace(/\s*series\s*$/i, "").trim() || name;
}

// Rank a series for newest-first ordering. The `series` table has no manual
// sort column, so derive an order from the name: a model number (iPhone 17 -> 17)
// sorts highest-first; named lines are slotted by era (Air newest; X/XR/XS ~ 10;
// SE near the older end). Unknown names fall to the bottom.
function seriesRank(name: string): number {
  const value = name.toLowerCase();
  const numberMatch = value.match(/\d{1,3}/);
  if (numberMatch) return Number(numberMatch[0]);
  if (/\bair\b/.test(value)) return 1000;
  if (/\bx[rs]?\b/.test(value)) return 10;
  if (/\bse\b/.test(value)) return 4;
  return -1;
}

type MobileSeriesCatalogPageProps = {
  brand: CatalogBrand;
  seriesList: CatalogSeries[];
  brandsPath: string;
  seriesPathPrefix: string;
  serviceLabel: string;
  homeHref?: string;
};

export function MobileSeriesCatalogPage({
  brand,
  seriesList,
  brandsPath,
  seriesPathPrefix,
  serviceLabel,
  homeHref = "/",
}: MobileSeriesCatalogPageProps) {
  const [search, setSearch] = useState("");

  // Filter by search, then order newest-first so the latest series surface at
  // the top of the list (matching the brand-page ordering elsewhere).
  const filteredSeries = useMemo(() => {
    const query = search.trim().toLowerCase();
    const matched = query
      ? seriesList.filter((series) => series.name.toLowerCase().includes(query))
      : seriesList;
    return [...matched].sort(
      (a, b) => seriesRank(b.name) - seriesRank(a.name) || a.name.localeCompare(b.name),
    );
  }, [search, seriesList]);

  return (
    <main className="flex-1">
      <div className="container py-6">
        {/* Breadcrumb */}
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

        {/* Brand header */}
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
            <h1 className="text-2xl font-semibold text-foreground md:text-4xl">Select {brand.name} Series</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose a series to find your model for {serviceLabel.toLowerCase()} services
            </p>
          </div>
        </div>

        {/* Search */}
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
            <Smartphone className="mx-auto mb-3 size-10 text-muted-foreground/30" />
            <p className="text-sm font-semibold text-muted-foreground">
              {search ? `No ${brand.name} series match your search` : `No series available for ${brand.name}`}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {search ? "Try a different series name." : "Check back soon!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filteredSeries.map((series) => (
              <CatalogPrefetchLink
                key={series.id}
                href={`${seriesPathPrefix}/${series.slug}`}
                eagerPrefetch={!search}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-4 shadow-card-brand transition-all hover:border-primary/30 hover:shadow-elevated-brand active:scale-95"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-11 flex-shrink-0 items-center justify-center rounded-xl bg-secondary">
                    <Smartphone className="size-5 text-primary" />
                  </div>
                  <span className="min-w-0 whitespace-normal break-words text-sm font-bold leading-tight text-foreground">
                    {formatSeriesLabel(series.name)}
                  </span>
                </div>
                <ChevronRight className="size-4 flex-shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </CatalogPrefetchLink>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
