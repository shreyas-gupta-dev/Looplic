"use client";

import { ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { BrandLogo } from "@/src/components/next/BrandLogo";
import { CatalogPrefetchLink } from "@/src/components/next/CatalogPrefetchLink";
import type { CatalogBrand } from "@/src/lib/data/catalog";

type BrandsCatalogPageProps = {
  brands: CatalogBrand[];
  serviceLabel: string;
  servicePathPrefix: string;
  homeHref?: string;
};

export function BrandsCatalogPage({
  brands,
  serviceLabel,
  servicePathPrefix,
  homeHref = "/",
}: BrandsCatalogPageProps) {
  const [search, setSearch] = useState("");

  const filteredBrands = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return brands;
    }

    return brands.filter((brand) => brand.name.toLowerCase().includes(query));
  }, [brands, search]);

  const heading = `${serviceLabel} Services`;
  const description = `Select your device brand to explore our professional ${serviceLabel.toLowerCase()} services with doorstep convenience.`;

  return (
    <main className="flex-1">
      <div className="container py-6">
        <div className="mb-5 flex items-center gap-1 text-xs font-semibold text-muted-foreground">
          <Link href={homeHref} className="transition-colors hover:text-foreground">
            Home
          </Link>
          <ChevronRight className="size-3" />
          <span className="text-foreground">Brands</span>
        </div>

        <div className="mb-6">
          <h1 className="mb-2 text-2xl font-semibold text-foreground md:text-4xl">{heading}</h1>
          <p className="max-w-lg text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="relative mb-6 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search brands..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {filteredBrands.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            {search ? "No brands match your search" : "No brands available yet"}
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {filteredBrands.map((brand) => (
              <CatalogPrefetchLink
                key={brand.id}
                href={`${servicePathPrefix}/${brand.slug}`}
                eagerPrefetch={!search}
                className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-border bg-card px-2 py-4 shadow-card-brand transition-all hover:border-primary/30 hover:shadow-elevated-brand active:scale-95"
              >
                <BrandLogo
                  name={brand.name}
                  imageUrl={brand.image_url}
                  letter={brand.letter}
                  gradient={brand.gradient}
                  className="size-12 rounded-xl object-contain"
                  fallbackClassName="size-12 rounded-xl shadow-sm"
                />
                <span className="text-center text-xs font-bold text-foreground">{brand.name}</span>
              </CatalogPrefetchLink>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
