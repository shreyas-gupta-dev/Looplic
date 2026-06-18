"use client";

import { ChevronRight, Loader2, Smartphone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { BrandLogo } from "@/src/components/next/BrandLogo";
import { CatalogPrefetchLink } from "@/src/components/next/CatalogPrefetchLink";
import type { CatalogBrand, CatalogModelWithSeries, CatalogSeries } from "@/src/lib/data/catalog";
import { buildServiceBookingRoute } from "@/src/lib/routes";
import type { ServiceType } from "@/src/lib/routes";

type ModelsBySeriesCatalogPageProps = {
  brand: CatalogBrand;
  series: CatalogSeries[];
  models: CatalogModelWithSeries[];
  brandsPath: string;
  serviceType: ServiceType;
  serviceLabel: string;
  homeHref?: string;
};

export function ModelsBySeriesCatalogPage({
  brand,
  series,
  models,
  brandsPath,
  serviceType,
  serviceLabel,
  homeHref = "/",
}: ModelsBySeriesCatalogPageProps) {
  const [search, setSearch] = useState("");
  const [loadingHref, setLoadingHref] = useState("");

  // Group models under their series, ordered by the series list, and drop empty
  // sections (also handles search by hiding series with no matching models).
  const groups = useMemo(() => {
    const query = search.trim().toLowerCase();
    const modelsBySeries = new Map<string, CatalogModelWithSeries[]>();
    for (const model of models) {
      if (query && !model.name.toLowerCase().includes(query)) continue;
      const bucket = modelsBySeries.get(model.series_id) ?? [];
      bucket.push(model);
      modelsBySeries.set(model.series_id, bucket);
    }
    return series
      .map((s) => ({ series: s, models: modelsBySeries.get(s.id) ?? [] }))
      .filter((group) => group.models.length > 0);
  }, [models, series, search]);

  const totalShown = groups.reduce((count, group) => count + group.models.length, 0);

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
            <h1 className="text-2xl font-semibold text-foreground md:text-4xl">Select {brand.name} Model</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose your model for {serviceLabel.toLowerCase()} services
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6 max-w-sm">
          <input
            type="text"
            placeholder={`Search ${brand.name} model...`}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {totalShown === 0 ? (
          <div className="py-16 text-center">
            <Smartphone className="mx-auto mb-3 size-10 text-muted-foreground/30" />
            <p className="text-sm font-semibold text-muted-foreground">
              {search ? `No models match "${search}"` : `No models available for ${brand.name}`}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {search ? "Try a different model name." : "Check back soon!"}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {groups.map((group) => (
              <section key={group.series.id}>
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                  {group.series.name}
                </h2>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                  {group.models.map((model, index) => {
                    const href = buildServiceBookingRoute(serviceType, brand.slug, model.series_slug, model.slug);
                    const isLoading = loadingHref === href;
                    return (
                      <CatalogPrefetchLink
                        key={model.id}
                        href={href}
                        eagerPrefetch={!search && index < 4}
                        onClick={() => setLoadingHref(href)}
                        className="group flex flex-col items-center gap-2 rounded-2xl border border-border bg-card px-3 py-4 shadow-card-brand transition-all hover:border-primary/30 hover:shadow-elevated-brand active:scale-95"
                      >
                        {isLoading ? (
                          <div className="flex size-16 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Loader2 className="size-6 animate-spin" />
                          </div>
                        ) : model.image_url ? (
                          <Image
                            src={model.image_url}
                            alt={model.name}
                            width={64}
                            height={64}
                            className="size-16 rounded-xl object-contain"
                            unoptimized
                          />
                        ) : (
                          <div className="flex size-16 items-center justify-center rounded-xl bg-secondary">
                            <Smartphone className="size-7 text-primary" />
                          </div>
                        )}
                        <span className="block w-full whitespace-normal break-words text-center text-xs font-bold leading-tight text-foreground">
                          {isLoading ? "Loading services..." : model.name}
                        </span>
                      </CatalogPrefetchLink>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
