import {
  getBrandsForListing,
  getModelScreenGuards,
  getModelsForSeries,
  getRepairCategories,
  getRepairSubcategories,
  getSeriesForBrand,
  type CatalogServiceType,
} from "@/src/lib/data/catalog";

// Paginated catalog navigation for the WhatsApp wizard.
//
// The website can render 19 brands and 567 models on one page; a WhatsApp
// interactive list holds TEN rows total. So every picker here is paginated, and
// two of those ten rows are spent on navigation ("Show more" / "Back"), leaving
// eight options per page. Customers who don't want to page can just type the
// model name — the caller falls back to searchDevices() for that.
//
// The pagination maths itself lives in ./steps (dependency-free, unit-tested).
export { PAGE_SIZE, paginate, type Page } from "./steps";

export type PickerOption = {
  id: string;
  title: string;
  description?: string | null;
};

function inr(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || !Number.isFinite(Number(amount))) return "";
  return `₹${Number(amount).toLocaleString("en-IN")}`;
}

export async function listBrands(catalogType: CatalogServiceType): Promise<PickerOption[]> {
  const brands = await getBrandsForListing(catalogType);
  return brands.map((brand) => ({ id: brand.id, title: brand.name }));
}

// The catalog layer throws on a DB failure on purpose (so ISR keeps serving its
// last good page). In a conversation an exception is much worse than an empty
// list — it means the customer gets no reply at all — so the pickers swallow it
// and let the caller fall back to "type your model name".
export async function listSeries(brandId: string): Promise<PickerOption[]> {
  if (!brandId) return [];
  try {
    const series = await getSeriesForBrand(brandId);
    return series.map((row) => ({ id: row.id, title: row.name }));
  } catch (err) {
    console.error("[whatsapp:flow] listSeries failed", err);
    return [];
  }
}

export async function listModels(seriesId: string): Promise<PickerOption[]> {
  if (!seriesId) return [];
  try {
    const models = await getModelsForSeries(seriesId);
    return models.map((row) => ({ id: row.id, title: row.name }));
  } catch (err) {
    console.error("[whatsapp:flow] listModels failed", err);
    return [];
  }
}

export async function listRepairCategories(
  serviceType: "mobile" | "laptop",
): Promise<PickerOption[]> {
  const categories = await getRepairCategories(serviceType);
  return categories.map((category) => ({ id: category.id, title: category.name }));
}

export type RepairServiceOption = PickerOption & {
  price: number | null;
  priceVisible: boolean;
};

// Repair services within a category, priced for this exact model (per-model
// override if one exists, else the base price) — the same numbers the website
// shows, including honouring the global price-visibility switch in app_settings.
export async function listRepairServices(
  serviceType: "mobile" | "laptop",
  categoryId: string,
  modelId: string,
): Promise<RepairServiceOption[]> {
  const subcategories = await getRepairSubcategories([categoryId], modelId);
  return subcategories.map((subcategory) => {
    const priceVisible = subcategory.price_visible !== false;
    const price = Number(subcategory.price);
    const hasPrice = Number.isFinite(price) && price > 0;
    return {
      id: subcategory.id,
      title: subcategory.name,
      description: priceVisible && hasPrice ? `From ${inr(price)}` : "Price confirmed by our team",
      price: hasPrice ? price : null,
      priceVisible,
    };
  });
}

export type GuardOption = PickerOption & { guardType: string; price: number | null };

// Screen guards available for a model. The website strips the leading
// "<category> - " prefix admin uses on guard_type, so we do the same.
export function displayGuardType(guardType: string): string {
  const parts = guardType.split(" - ");
  return parts.length > 1 ? parts.slice(1).join(" - ") : guardType;
}

export async function listScreenGuards(modelId: string): Promise<GuardOption[]> {
  const guards = await getModelScreenGuards(modelId);
  return guards.map((guard) => {
    const price = Number(guard.price);
    const hasPrice = Number.isFinite(price) && price > 0;
    return {
      id: guard.id,
      guardType: guard.guard_type,
      title: displayGuardType(guard.guard_type),
      description: hasPrice ? inr(price) : "Price confirmed by our team",
      price: hasPrice ? price : null,
    };
  });
}
