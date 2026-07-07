"use client";

import { Search, Smartphone } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

export type SellModelItem = {
  id: string;
  name: string;
  seriesName: string;
  imageUrl: string | null;
  href: string;
};

function ModelImage({ name, imageUrl }: { name: string; imageUrl: string | null }) {
  const [failed, setFailed] = useState(false);
  const usable = typeof imageUrl === "string" && imageUrl.trim() && !failed ? imageUrl.trim() : "";

  return (
    <div className="flex size-20 items-center justify-center rounded-2xl bg-gray-50 p-2.5">
      {usable ? (
        <img src={usable} alt={name} loading="lazy" decoding="async" className="h-full w-full object-contain" onError={() => setFailed(true)} />
      ) : (
        <Smartphone className="size-7 text-violet-400" />
      )}
    </div>
  );
}

export function SellModelsGrid({
  models,
  noun,
  ctaLabel = "Get instant quote",
  searchLabel,
}: {
  models: SellModelItem[];
  noun: string;
  ctaLabel?: string;
  searchLabel?: string;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return models;
    return models.filter(
      (model) => model.name.toLowerCase().includes(normalized) || model.seriesName.toLowerCase().includes(normalized),
    );
  }, [models, query]);

  return (
    <div>
      <div className="mb-5 flex items-center rounded-full bg-white p-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.05)]">
        <Search className="ml-3 size-4 flex-shrink-0 text-gray-400" />
        <input
          type="text"
          placeholder={searchLabel ?? `Search your ${noun} model...`}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full bg-transparent p-2.5 text-[13px] font-medium text-gray-900 outline-none placeholder:text-gray-400"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
          <p className="text-[13px] font-semibold text-gray-900">No models match “{query.trim()}”.</p>
          <p className="mt-1 text-[12px] text-gray-500">Try a shorter name, e.g. just the number.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:gap-3">
          {filtered.map((model) => (
            <Link
              key={model.id}
              href={model.href}
              className="group flex flex-col items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_24px_70px_rgba(15,23,42,0.1)] active:scale-95"
            >
              <ModelImage name={model.name} imageUrl={model.imageUrl} />
              <div className="w-full">
                <span className="block whitespace-normal break-words text-center text-xs font-bold leading-tight text-gray-900">
                  {model.name}
                </span>
                <span className="mt-1 block text-center text-[10px] font-semibold uppercase tracking-wide text-violet-500">
                  {ctaLabel}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
