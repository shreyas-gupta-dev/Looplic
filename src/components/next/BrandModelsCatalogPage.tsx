"use client";

import { ChevronRight, Search, Smartphone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { BrandLogo } from "@/src/components/next/BrandLogo";
import type { CatalogBrand, CatalogModelWithSeries } from "@/src/lib/data/catalog";
import { buildServiceBookingRoute } from "@/src/lib/routes";
import type { ServiceType } from "@/src/lib/routes";

type BrandModelsCatalogPageProps = {
  brand: CatalogBrand;
  models: CatalogModelWithSeries[];
  brandsPath: string;
  serviceType: ServiceType;
  serviceLabel: string;
  homeHref?: string;
};

export function BrandModelsCatalogPage({
  brand,
  models,
  brandsPath,
  serviceType,
  serviceLabel,
  homeHref = "/",
}: BrandModelsCatalogPageProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return models;
    return models.filter((m) => m.name.toLowerCase().includes(q));
  }, [search, models]);

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
            <h1 className="text-2xl font-semibold text-foreground md:text-4xl">
              Select {brand.name} Model
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {models.length} models available for {serviceLabel.toLowerCase()}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={`Search ${brand.name} model...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {filtered.length === 0 ? (
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
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((model) => (
              <Link
                key={model.id}
                href={buildServiceBookingRoute(serviceType, brand.slug, model.series_slug, model.slug)}
                className="group flex items-center rounded-2xl border border-border bg-card p-4 shadow-card-brand transition-all hover:border-primary/30 hover:shadow-elevated-brand active:scale-[0.98]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-10 flex-shrink-0 items-center justify-center rounded-xl bg-secondary overflow-hidden">
                    {model.image_url ? (
                      <Image
                        src={model.image_url}
                        alt={model.name}
                        width={40}
                        height={40}
                        className="size-10 object-contain"
                        unoptimized
                      />
                    ) : (
                      <Smartphone className="size-5 text-primary" />
                    )}
                  </div>
                  <span className="whitespace-normal break-words text-sm font-bold leading-tight text-foreground">
                    {model.name}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
