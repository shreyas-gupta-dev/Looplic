"use client";

import { ChevronRight, Laptop, Loader2, Smartphone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { BrandLogo } from "@/src/components/next/BrandLogo";
import { CatalogPrefetchLink } from "@/src/components/next/CatalogPrefetchLink";
import type { CatalogBrand, CatalogModel, CatalogSeries } from "@/src/lib/data/catalog";

type ModelsCatalogPageProps = {
  brand: CatalogBrand;
  series: CatalogSeries;
  models: CatalogModel[];
  brandsPath: string;
  seriesPath: string;
  modelPathPrefix: string;
  serviceLabel: string;
  homeHref?: string;
  // When a brand has a single series (e.g. the "All Models" Cashify brands), the
  // brand page renders this model grid directly without a series-selection step.
  // In that case there is no meaningful series to show, so hide the series crumb
  // and drop the series name from headings/placeholders.
  collapsedSeries?: boolean;
};

export function ModelsCatalogPage({
  brand,
  series,
  models,
  brandsPath,
  seriesPath,
  modelPathPrefix,
  serviceLabel,
  homeHref = "/",
  collapsedSeries = false,
}: ModelsCatalogPageProps) {
  const DeviceIcon = brand.service_type === "laptop" ? Laptop : Smartphone;
  const [search, setSearch] = useState("");
  const [loadingHref, setLoadingHref] = useState("");

  const heading = collapsedSeries ? `${brand.name} Models` : `${brand.name} ${series.name} Models`;
  const searchScope = collapsedSeries ? brand.name : `${brand.name} ${series.name}`;

  const filteredModels = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return models;
    }

    return models.filter((model) => model.name.toLowerCase().includes(query));
  }, [models, search]);

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
          {collapsedSeries ? (
            <span className="text-foreground">{brand.name}</span>
          ) : (
            <>
              <Link href={seriesPath} className="transition-colors hover:text-foreground">
                {brand.name}
              </Link>
              <ChevronRight className="size-3" />
              <span className="text-foreground">{series.name}</span>
            </>
          )}
        </div>

        <div className="mb-6 flex items-center gap-4">
          <BrandLogo
            name={brand.name}
            imageUrl={brand.image_url}
            letter={brand.letter}
            gradient={brand.gradient}
            className="size-14 rounded-2xl border border-border object-contain"
            fallbackClassName="size-14 rounded-2xl"
          />
          <div>
            <h1 className="text-2xl font-semibold text-foreground md:text-3xl">
              {heading}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">Select your model for {serviceLabel.toLowerCase()} services</p>
          </div>
        </div>

        <div className="relative mb-6 max-w-sm">
          <input
            type="text"
            placeholder={`Search ${searchScope} models...`}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {filteredModels.length === 0 ? (
          <div className="py-16 text-center">
            <DeviceIcon className="mx-auto mb-3 size-10 text-muted-foreground/30" />
            <p className="text-sm font-semibold text-muted-foreground">{search ? "No models match your search" : "No models available"}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {filteredModels.map((model, index) => (
              <CatalogPrefetchLink
                key={model.id}
                href={`${modelPathPrefix}/${model.slug}`}
                eagerPrefetch={!search && index < 8}
                onClick={() => setLoadingHref(`${modelPathPrefix}/${model.slug}`)}
                className="group flex flex-col items-center gap-2 rounded-2xl border border-border bg-card px-3 py-4 shadow-card-brand transition-all hover:border-primary/30 hover:shadow-elevated-brand active:scale-95"
              >
                <div className="flex size-20 items-center justify-center rounded-2xl bg-secondary/40 p-2.5">
                  {loadingHref === `${modelPathPrefix}/${model.slug}` ? (
                    <Loader2 className="size-6 animate-spin text-primary" />
                  ) : model.image_url ? (
                    <Image
                      src={model.image_url}
                      alt={model.name}
                      width={72}
                      height={72}
                      className="h-full w-full object-contain"
                    />
                  ) : brand.image_url ? (
                    <img src={brand.image_url} alt={brand.name} className="h-full w-full object-contain p-1" loading="lazy" />
                  ) : (
                    <DeviceIcon className="size-7 text-primary" />
                  )}
                </div>
                <div className="w-full">
                  <span className="block whitespace-normal break-words text-center text-xs font-bold leading-tight text-foreground">
                    {loadingHref === `${modelPathPrefix}/${model.slug}` ? "Loading services..." : model.name}
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
