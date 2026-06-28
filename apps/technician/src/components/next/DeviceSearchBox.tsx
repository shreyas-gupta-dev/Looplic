"use client";

import { ArrowRight, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type { CatalogBrand, SearchModel, SearchSeries } from "@/src/lib/data/catalog";
import { buildServiceBookingRoute, buildServiceSeriesRoute, type ServiceType } from "@/src/lib/routes";

type DeviceSearchBoxProps = {
  placeholder: string;
  browseHref: string;
  brands: CatalogBrand[];
  series: SearchSeries[];
  models: SearchModel[];
  mode: ServiceType;
};

type SearchResult = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  kind: "Brand" | "Series" | "Model";
};

function scoreMatch(query: string, value: string) {
  const lower = value.toLowerCase();
  if (lower === query) return 400;
  if (lower.startsWith(query)) return 250;
  if (lower.includes(query)) return 120;
  return 0;
}

export function DeviceSearchBox({ placeholder, browseHref, brands, series, models, mode }: DeviceSearchBoxProps) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (normalized.length < 2) {
      return [] as SearchResult[];
    }

    const brandResults = brands
      .map((brand) => ({
        id: `brand-${brand.id}`,
        title: brand.name,
        subtitle: "Browse brand",
        href: buildServiceSeriesRoute(mode, brand.slug),
        kind: "Brand" as const,
        score: scoreMatch(normalized, brand.name),
      }))
      .filter((item) => item.score > 0);

    const seriesResults = series
      .map((seriesItem) => ({
        id: `series-${seriesItem.id}`,
        title: seriesItem.name,
        subtitle: `${seriesItem.brand_name} series`,
        href: buildServiceSeriesRoute(mode, seriesItem.brand_slug, seriesItem.slug),
        kind: "Series" as const,
        score: Math.max(scoreMatch(normalized, seriesItem.name), scoreMatch(normalized, `${seriesItem.brand_name} ${seriesItem.name}`)),
      }))
      .filter((item) => item.score > 0);

    const modelResults = models
      .map((modelItem) => ({
        id: `model-${modelItem.id}`,
        title: modelItem.name,
        subtitle: `${modelItem.brand_name} ${modelItem.series_name}`,
        href: buildServiceBookingRoute(mode, modelItem.brand_slug, modelItem.series_slug, modelItem.slug),
        kind: "Model" as const,
        score: Math.max(
          scoreMatch(normalized, modelItem.name),
          scoreMatch(normalized, `${modelItem.brand_name} ${modelItem.name}`),
          scoreMatch(normalized, `${modelItem.brand_name} ${modelItem.series_name} ${modelItem.name}`),
        ),
      }))
      .filter((item) => item.score > 0);

    return [...modelResults, ...seriesResults, ...brandResults]
      .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
      .slice(0, 8)
      .map(({ score, ...item }) => item);
  }, [brands, mode, models, query, series]);

  const topResult = results[0];

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(topResult?.href || browseHref);
  }

  return (
    <div className="relative mt-6 px-1">
      <form onSubmit={handleSubmit} className="flex items-center rounded-2xl border-2 border-transparent bg-card shadow-card-brand transition-all duration-300 focus-within:border-primary/50 focus-within:shadow-search">
        <Search className="ml-3.5 size-4 flex-shrink-0 text-muted-foreground" />
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full bg-transparent p-3.5 text-[13px] font-semibold text-foreground outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          className="mr-1.5 flex-shrink-0 rounded-xl gradient-brand p-2.5 transition-transform active:scale-95"
          aria-label="Open search result"
        >
          <ArrowRight className="size-4 text-primary-foreground" />
        </button>
      </form>

      {query.trim().length >= 2 ? (
        <div className="absolute left-1 right-1 z-20 mt-2 overflow-hidden rounded-xl border border-border bg-card shadow-elevated-brand">
          {results.length > 0 ? (
            <div className="divide-y divide-border">
              {results.map((result) => (
                <Link key={result.id} href={result.href} className="flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/60">
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-semibold text-foreground">{result.title}</div>
                    <div className="truncate text-[11px] text-muted-foreground">{result.subtitle}</div>
                  </div>
                  <span className="shrink-0 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">{result.kind}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-4 text-left">
              <p className="text-[13px] font-semibold text-foreground">No results found.</p>
              <p className="mt-1 text-[11px] text-muted-foreground">Try a brand, series, or model name, or browse the full catalog.</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
