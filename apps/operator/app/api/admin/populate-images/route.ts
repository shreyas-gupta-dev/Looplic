import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import { brands, models, series } from "@/src/lib/db/schema";
import { eq } from "drizzle-orm";

const SECRET = "looplic-images-2026";

// Fetch thumbnail from Wikipedia article
async function wikiThumbnail(title: string, sizePx = 500): Promise<string | null> {
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const json = await res.json();
    const thumb: string | undefined = json?.thumbnail?.source;
    if (!thumb) return null;
    // Upscale to requested size
    return thumb.replace(/\/\d+px-/, `/${sizePx}px-`);
  } catch { return null; }
}

// Wikipedia search → first result thumbnail
async function wikiSearch(query: string, sizePx = 500): Promise<string | null> {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=0&format=json&srlimit=3`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const json = await res.json();
    const hits = json?.query?.search as any[];
    if (!hits?.length) return null;
    for (const hit of hits) {
      const img = await wikiThumbnail(hit.title, sizePx);
      if (img) return img;
    }
  } catch {}
  return null;
}

// Candidates for Wikipedia article titles given brand + model
function wikiCandidates(brandName: string, modelName: string): string[] {
  const brand = brandName.trim();
  const model = modelName.trim();
  const b = brand.toLowerCase();
  const m = model.toLowerCase();

  const joined = `${brand} ${model}`;

  // Apple: model names already contain "iPhone", "MacBook", etc.
  if (b === "apple") return [model, joined, `Apple ${model}`];

  // Samsung: models might be stored as "Galaxy S24 Ultra" or "Samsung Galaxy S24 Ultra"
  if (b === "samsung") {
    const withBrand = m.startsWith("samsung") ? model : `Samsung ${model}`;
    return [withBrand, model, joined];
  }

  // Xiaomi / Redmi / POCO — Xiaomi's sub-brands
  if (["xiaomi", "redmi", "poco", "mi"].includes(b)) {
    return [joined, model, `Xiaomi ${model}`, `Redmi ${model}`, `POCO ${model}`];
  }

  // OnePlus: articles titled "OnePlus 12" etc.
  if (b === "oneplus") return [joined, model];

  // Google Pixel
  if (b === "google") return [`Google Pixel ${model}`, `Pixel ${model}`, joined];

  // Motorola
  if (b === "motorola") return [joined, `Motorola Moto ${model}`, model];

  // Laptops: Dell, HP, Lenovo, ASUS, Acer, Microsoft
  if (["dell", "hp", "lenovo", "asus", "acer", "microsoft"].includes(b)) {
    return [joined, model, `${brand} ${model} laptop`];
  }

  // Default
  return [joined, model, `${brand} ${model} smartphone`];
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { secret, brandName: filterBrand, forceUpdate, dryRun, offset = 0, limit = 50 } = body;

  if (secret !== SECRET) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const allBrands = await db.select().from(brands);
  const allSeries = await db.select().from(series);
  let allModels = await db.select().from(models);

  const brandMap = Object.fromEntries(allBrands.map(b => [b.id, b]));
  const seriesMap = Object.fromEntries(allSeries.map(s => [s.id, s]));

  // Filter by brand name if requested
  if (filterBrand) {
    const matchBrand = allBrands.find(b => b.name.toLowerCase() === filterBrand.toLowerCase());
    if (matchBrand) {
      const seriesIds = new Set(allSeries.filter(s => s.brandId === matchBrand.id).map(s => s.id));
      allModels = allModels.filter(m => seriesIds.has(m.seriesId));
    }
  }

  // Skip models that already have images unless forceUpdate
  if (!forceUpdate) allModels = allModels.filter(m => !m.imageUrl);

  // Paginate
  const page = allModels.slice(offset, offset + limit);
  const total = allModels.length;

  const results: any[] = [];
  let updated = 0;
  let failed = 0;

  for (const model of page) {
    const ser = seriesMap[model.seriesId];
    const brand = ser ? brandMap[ser.brandId] : null;
    if (!brand) { results.push({ model: model.name, status: "no_brand" }); failed++; continue; }

    const candidates = wikiCandidates(brand.name, model.name);
    let imageUrl: string | null = null;

    for (const title of candidates) {
      imageUrl = await wikiThumbnail(title);
      if (imageUrl) break;
    }

    // Fallback: Wikipedia search
    if (!imageUrl) {
      imageUrl = await wikiSearch(`${brand.name} ${model.name} smartphone`);
    }

    if (imageUrl) {
      if (!dryRun) await db.update(models).set({ imageUrl }).where(eq(models.id, model.id));
      results.push({ model: model.name, brand: brand.name, url: imageUrl, status: "ok" });
      updated++;
    } else {
      results.push({ model: model.name, brand: brand.name, url: null, status: "not_found" });
      failed++;
    }
  }

  return NextResponse.json({
    ok: true,
    total,
    processed: page.length,
    remaining: Math.max(0, total - offset - page.length),
    nextOffset: offset + page.length,
    updated,
    failed,
    results,
  });
}
