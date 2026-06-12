import { unstable_cache } from "next/cache";

import { withRedisCache } from "@/src/lib/redis";
import { slugify } from "@/src/lib/slug";
import { createPublicClient } from "@/src/lib/data-client/public";

export type CatalogBrand = {
  id: string;
  name: string;
  slug: string;
  letter: string;
  gradient: string;
  image_url: string | null;
  service_type: string;
};

export type CatalogSeries = {
  id: string;
  brand_id: string;
  name: string;
  slug: string;
  image_url: string | null;
};

export type CatalogModel = {
  id: string;
  series_id: string;
  name: string;
  slug: string;
  image_url: string | null;
};

export type CatalogModelWithSeries = CatalogModel & {
  series_slug: string;
  series_name: string;
};

export type ModelScreenGuard = {
  id: string;
  guard_type: string;
  image_url: string | null;
  price: number;
};

export type RepairCategory = {
  id: string;
  name: string;
  image_url: string | null;
  service_type: string;
  sort_order?: number | null;
};

export type RepairSubcategory = {
  id: string;
  category_id: string;
  name: string;
  image_url: string | null;
  price: number;
  price_visible?: boolean;
  sort_order?: number | null;
  base_price?: number;
  model_price_id?: string | null;
  has_model_price?: boolean;
};

export type SearchSeries = {
  id: string;
  brand_id: string;
  brand_name: string;
  brand_slug: string;
  name: string;
  slug: string;
};

export type SearchModel = {
  id: string;
  series_id: string;
  series_name: string;
  series_slug: string;
  brand_name: string;
  brand_slug: string;
  name: string;
  slug: string;
};

export type CatalogSearchIndex = {
  brands: CatalogBrand[];
  series: SearchSeries[];
  models: SearchModel[];
};

const fallbackBrands: CatalogBrand[] = [
  { id: "apple", name: "Apple", slug: "apple", letter: "A", gradient: "from-gray-700 to-gray-900", image_url: null, service_type: "mobile" },
  { id: "samsung", name: "Samsung", slug: "samsung", letter: "S", gradient: "from-blue-500 to-blue-700", image_url: null, service_type: "mobile" },
  { id: "google", name: "Google", slug: "google", letter: "G", gradient: "from-red-400 to-yellow-400", image_url: null, service_type: "mobile" },
  { id: "oneplus", name: "OnePlus", slug: "oneplus", letter: "1+", gradient: "from-red-500 to-red-700", image_url: null, service_type: "mobile" },
  { id: "xiaomi", name: "Mi", slug: "mi", letter: "Mi", gradient: "from-orange-400 to-orange-600", image_url: null, service_type: "mobile" },
  { id: "dell", name: "Dell", slug: "dell", letter: "D", gradient: "from-sky-500 to-blue-600", image_url: null, service_type: "laptop" },
  { id: "hp", name: "HP", slug: "hp", letter: "HP", gradient: "from-indigo-500 to-sky-500", image_url: null, service_type: "laptop" },
  { id: "lenovo", name: "Lenovo", slug: "lenovo", letter: "L", gradient: "from-red-500 to-rose-600", image_url: null, service_type: "laptop" },
];

function normalizeBrandSlug(slug: string) {
  return slug === "xiaomi" ? "mi" : slug;
}

function normalizeBrandName(name: string, slug: string) {
  return slug === "mi" ? "Mi" : name;
}

const fallbackRepairCategories: RepairCategory[] = [
  { id: "d6a53ed0-b18c-46e4-8382-e6320f0a13b8", name: "Battery", image_url: null, service_type: "mobile" },
  { id: "b88532a2-198c-4489-938f-2dbf7b219075", name: "Body", image_url: null, service_type: "mobile" },
  { id: "f6f8a8a6-8867-4bf6-b73b-95e4c9b1618a", name: "Camera", image_url: null, service_type: "mobile" },
  { id: "2d3bd55b-8e05-4ad1-b78e-e8a76712ce35", name: "Motherboard", image_url: null, service_type: "mobile" },
  { id: "1dab65b6-cae3-485c-b231-4b551bc0fc43", name: "Other Service", image_url: null, service_type: "mobile" },
  { id: "a46f9cf5-c005-48c3-8672-3d097587e6fb", name: "Screen", image_url: null, service_type: "mobile" },
  { id: "c0ac6c43-850e-468e-befb-a1ee5a7ed063", name: "Sensor", image_url: null, service_type: "mobile" },
  { id: "32235a1e-52c7-44fc-8858-a448909b7ce9", name: "Sound", image_url: null, service_type: "mobile" },
  { id: "a67d85e7-f76c-44f1-99bc-eb8ba453ad3d", name: "Battery Replacement", image_url: null, service_type: "laptop" },
  { id: "0d767e71-3269-4531-a4a7-9b9ab4ada287", name: "Hinge Repair", image_url: null, service_type: "laptop" },
  { id: "07761919-1de9-4863-a381-a396ce00b510", name: "Keyboard Replacement", image_url: null, service_type: "laptop" },
  { id: "b79b385d-c728-496f-bba3-3e07bf32ec64", name: "Motherboard Repair", image_url: null, service_type: "laptop" },
  { id: "e6fcee88-9e53-452e-bd6b-0498e6759617", name: "Screen Replacement", image_url: null, service_type: "laptop" },
  { id: "48250202-e02d-478b-b5b2-884cd11ce33d", name: "SSD/RAM Upgrade", image_url: null, service_type: "laptop" },
];

const fallbackRepairSubcategories: RepairSubcategory[] = [
  { id: "1b078b94-bff1-4b7f-bc04-ac0fb2202630", category_id: "b88532a2-198c-4489-938f-2dbf7b219075", name: "Body Housing Replacement", image_url: null, price: 999 },
  { id: "eeee700f-0d87-4ffe-b751-70226ed41434", category_id: "a46f9cf5-c005-48c3-8672-3d097587e6fb", name: "Back Glass Replacement", image_url: null, price: 199 },
  { id: "8b220074-d814-47b8-ae20-c0c446744e94", category_id: "a46f9cf5-c005-48c3-8672-3d097587e6fb", name: "Screen Replacement", image_url: null, price: 999 },
  { id: "c342e8e5-de15-4854-95cd-330c77b09257", category_id: "a46f9cf5-c005-48c3-8672-3d097587e6fb", name: "Glass Replacement", image_url: null, price: 699 },
  { id: "a55f00fe-1686-425d-88b3-07c18622569c", category_id: "d6a53ed0-b18c-46e4-8382-e6320f0a13b8", name: "Battery Replacement", image_url: null, price: 599 },
  { id: "09327a68-3e62-4870-973d-625e5f0f6d11", category_id: "d6a53ed0-b18c-46e4-8382-e6320f0a13b8", name: "Backup Issue", image_url: null, price: 299 },
  { id: "4c5cd05c-21a9-4fe7-b03f-fd2e4edc2954", category_id: "f6f8a8a6-8867-4bf6-b73b-95e4c9b1618a", name: "Camera Repair", image_url: null, price: 299 },
  { id: "4beb8b0f-f5f3-4592-8d61-7d29c8557ceb", category_id: "f6f8a8a6-8867-4bf6-b73b-95e4c9b1618a", name: "Camera Replacement (Front)", image_url: null, price: 399 },
  { id: "5729f590-4beb-4fcf-b2e0-e62ddd209f6a", category_id: "f6f8a8a6-8867-4bf6-b73b-95e4c9b1618a", name: "Camera Replacement (Back)", image_url: null, price: 499 },
  { id: "93a8b40e-b394-4515-a461-7cb4eda4af5b", category_id: "c0ac6c43-850e-468e-befb-a1ee5a7ed063", name: "Finger Print Sensor (Repair)", image_url: null, price: 399 },
  { id: "c35021c9-fb53-4d3b-92c8-4e500e843c1e", category_id: "a67d85e7-f76c-44f1-99bc-eb8ba453ad3d", name: "Hinge on Battery", image_url: null, price: 999 },
];

export const CATALOG_REVALIDATE_SECONDS = 300;
const CATALOG_REDIS_PREFIX = "looplic:catalog:v1";

async function getScreenGuardTypeImageMap() {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("screen_guard_types")
    .select("name, image_url");

  if (error || !data) {
    return new Map<string, string>();
  }

  return new Map(
    data
      .filter((item) => typeof item.image_url === "string" && item.image_url.trim())
      .map((item) => [item.name.trim().toLowerCase(), item.image_url!]),
  );
}


async function queryBrands(serviceType: "mobile" | "laptop") {
  const supabase = createPublicClient();
  const selectFieldsWithSlug = "id, name, slug, letter, gradient, image_url, service_type";
  const selectFieldsWithoutSlug = "id, name, letter, gradient, image_url, service_type";

  const mapBrandWithSlug = (brand: any) => {
    const slug = normalizeBrandSlug(brand.slug || slugify(brand.name) || brand.id);

    return {
      ...brand,
      name: normalizeBrandName(brand.name, slug),
      slug,
    };
  };

  const mapBrandWithoutSlug = (brand: any) => {
    const slug = normalizeBrandSlug(slugify(brand.name) || brand.id);

    return {
      ...brand,
      name: normalizeBrandName(brand.name, slug),
      slug,
    };
  };

  const fallback = () => fallbackBrands.filter((brand) => brand.service_type === serviceType);

  const filteredBrands = await supabase
    .from("brands")
    .select(selectFieldsWithSlug)
    .eq("service_type", serviceType)
    .order("sort_order")
    .order("name");

  if (!filteredBrands.error && filteredBrands.data && filteredBrands.data.length > 0) {
    return filteredBrands.data.map(mapBrandWithSlug);
  }

  const filteredBrandsWithoutSlug = await supabase
    .from("brands")
    .select(selectFieldsWithoutSlug)
    .eq("service_type", serviceType)
    .order("sort_order")
    .order("name");

  if (!filteredBrandsWithoutSlug.error && filteredBrandsWithoutSlug.data && filteredBrandsWithoutSlug.data.length > 0) {
    return filteredBrandsWithoutSlug.data.map(mapBrandWithoutSlug);
  }

  return fallback();
}

export const getBrandsForListing = unstable_cache(async (serviceType: "mobile" | "laptop" = "mobile"): Promise<CatalogBrand[]> => {
  return withRedisCache(`${CATALOG_REDIS_PREFIX}:brands:${serviceType}`, CATALOG_REVALIDATE_SECONDS, async () => {
    try {
      return await queryBrands(serviceType);
    } catch {
      return fallbackBrands.filter((brand) => brand.service_type === serviceType);
    }
  });
}, ["catalog-brands-for-listing"], {
  revalidate: CATALOG_REVALIDATE_SECONDS,
  tags: ["catalog", "catalog-brands"],
});

export async function getBrandBySlug(brandSlug: string, serviceType?: "mobile" | "laptop"): Promise<CatalogBrand | null> {
  try {
    const resolvedServiceType = serviceType ?? "mobile";
    const normalizedBrandSlug = normalizeBrandSlug(brandSlug);
    const databaseBrandSlug = normalizedBrandSlug === "mi" ? "xiaomi" : normalizedBrandSlug;
    const supabase = createPublicClient();
    const directMatch = await supabase
      .from("brands")
      .select("id, name, slug, letter, gradient, image_url, service_type")
      .eq("service_type", resolvedServiceType)
      .eq("slug", databaseBrandSlug)
      .maybeSingle();

    if (!directMatch.error && directMatch.data) {
      const slug = normalizeBrandSlug(directMatch.data.slug || slugify(directMatch.data.name) || directMatch.data.id);
      return {
        ...directMatch.data,
        name: normalizeBrandName(directMatch.data.name, slug),
        slug,
      };
    }

    const list = await getBrandsForListing(serviceType ?? "mobile");
    const listDirectMatch = list.find((brand) => brand.slug === normalizedBrandSlug);
    if (listDirectMatch) return listDirectMatch;
    const fallbackMatch = list.find((brand) => normalizeBrandSlug(slugify(brand.name)) === normalizedBrandSlug);
    return fallbackMatch ?? null;
  } catch {
    return null;
  }
}

export async function getSeriesForBrand(brandId: string): Promise<CatalogSeries[]> {
  try {
    const supabase = createPublicClient();
    const result = await supabase
      .from("series")
      .select("id, brand_id, name, slug, image_url")
      .eq("brand_id", brandId)
      .order("name");

    if (!result.error && result.data) {
      return result.data.map((series) => ({
        ...series,
        slug: series.slug || slugify(series.name) || series.id,
      }));
    }
    return [];
  } catch {
    return [];
  }
}

export async function getSeriesBySlug(brandId: string, seriesSlug: string): Promise<CatalogSeries | null> {
  try {
    const supabase = createPublicClient();
    const directMatch = await supabase
      .from("series")
      .select("id, brand_id, name, slug, image_url")
      .eq("brand_id", brandId)
      .eq("slug", seriesSlug)
      .maybeSingle();

    if (!directMatch.error && directMatch.data) {
      return {
        ...directMatch.data,
        slug: directMatch.data.slug || slugify(directMatch.data.name) || directMatch.data.id,
      };
    }

    const list = await getSeriesForBrand(brandId);
    const listDirectMatch = list.find((series) => series.slug === seriesSlug);
    if (listDirectMatch) return listDirectMatch;
    return list.find((series) => slugify(series.name) === seriesSlug) ?? null;
  } catch {
    return null;
  }
}

export async function getModelsForSeries(seriesId: string): Promise<CatalogModel[]> {
  try {
    const supabase = createPublicClient();
    const result = await supabase
      .from("models")
      .select("id, series_id, name, slug, image_url")
      .eq("series_id", seriesId)
      .order("name");

    if (!result.error && result.data) {
      return result.data.map((model) => ({
        ...model,
        slug: model.slug || slugify(model.name) || model.id,
      }));
    }
    return [];
  } catch {
    return [];
  }
}

export async function getAllModelsForBrand(brandId: string): Promise<CatalogModelWithSeries[]> {
  try {
    const supabase = createPublicClient();

    const seriesData = await supabase
      .from("series")
      .select("id, name, slug")
      .eq("brand_id", brandId)
      .order("name");

    if (seriesData.error || !seriesData.data?.length) return [];

        const seriesList = seriesData.data.map((s: any) => ({
          id: s.id as string,
          name: s.name as string,
          slug: (s.slug || slugify(s.name) || s.id) as string,
        }));

        const seriesIds = seriesList.map((s) => s.id);
        const modelsData = await supabase
          .from("models")
          .select("id, series_id, name, slug, image_url")
          .in("series_id", seriesIds)
          .order("name");

        if (modelsData.error || !modelsData.data) return [];

        const seriesMap = new Map(seriesList.map((s) => [s.id, s]));

        return (modelsData.data as any[])
          .map((model) => {
            const series = seriesMap.get(model.series_id);
            if (!series) return null;
            return {
              id: model.id as string,
              series_id: model.series_id as string,
              name: model.name as string,
              slug: (model.slug || slugify(model.name) || model.id) as string,
              image_url: (model.image_url ?? null) as string | null,
              series_slug: series.slug,
              series_name: series.name,
            } satisfies CatalogModelWithSeries;
          })
          .filter((m): m is CatalogModelWithSeries => m !== null);
  } catch {
    return [];
  }
}

export async function getModelBySlug(seriesId: string, modelSlug: string): Promise<CatalogModel | null> {
  try {
    const supabase = createPublicClient();
    const directMatch = await supabase
      .from("models")
      .select("id, series_id, name, slug, image_url")
      .eq("series_id", seriesId)
      .eq("slug", modelSlug)
      .maybeSingle();

    if (!directMatch.error && directMatch.data) {
      return {
        ...directMatch.data,
        slug: directMatch.data.slug || slugify(directMatch.data.name) || directMatch.data.id,
      };
    }

    const list = await getModelsForSeries(seriesId);
    const listDirectMatch = list.find((model) => model.slug === modelSlug);

    if (listDirectMatch) {
      return listDirectMatch;
    }

    const fallbackMatch = list.find((model) => slugify(model.name) === modelSlug);
    return fallbackMatch ?? null;
  } catch {
    return null;
  }
}

export const getModelScreenGuards = unstable_cache(async (modelId: string): Promise<ModelScreenGuard[]> => {
  return withRedisCache(`${CATALOG_REDIS_PREFIX}:screen-guards:${modelId}`, CATALOG_REVALIDATE_SECONDS, async () => {
    try {
      const supabase = createPublicClient();
      const typeImageMap = await getScreenGuardTypeImageMap();
      const primaryQuery = await supabase
        .from("model_screen_guards")
        .select("id, guard_type, image_url, price")
        .eq("model_id", modelId)
        .order("guard_type");

      if (!primaryQuery.error && primaryQuery.data) {
        return primaryQuery.data.map((guard) => ({
          ...guard,
          image_url: guard.image_url || typeImageMap.get(guard.guard_type.trim().toLowerCase()) || null,
        }));
      }

      const missingImageUrlColumn =
        primaryQuery.error?.message?.includes("image_url") &&
        primaryQuery.error.message.includes("model_screen_guards");

      if (!missingImageUrlColumn) {
        return [];
      }

      const fallbackQuery = await supabase
        .from("model_screen_guards")
        .select("id, guard_type, price")
        .eq("model_id", modelId)
        .order("guard_type");

      if (fallbackQuery.error || !fallbackQuery.data) {
        return [];
      }

      return fallbackQuery.data.map((guard) => ({
        ...guard,
        image_url: typeImageMap.get(guard.guard_type.trim().toLowerCase()) || null,
      }));
    } catch {
      return [];
    }
  });
}, ["catalog-model-screen-guards"], {
  revalidate: CATALOG_REVALIDATE_SECONDS,
  tags: ["catalog", "catalog-screen-guards"],
});

export const getRepairCategories = unstable_cache(async (serviceType: "mobile" | "laptop"): Promise<RepairCategory[]> => {
  return withRedisCache(`${CATALOG_REDIS_PREFIX}:repair-categories:${serviceType}`, CATALOG_REVALIDATE_SECONDS, async () => {
    const fallback = () => fallbackRepairCategories.filter((category) => category.service_type === serviceType);

    try {
      const supabase = createPublicClient();
      const { data, error } = await supabase
        .from("repair_categories")
        .select("id, name, image_url, service_type, sort_order")
        .eq("service_type", serviceType)
        .order("sort_order")
        .order("name");

      if (error || !data) {
        return fallback();
      }

      return data.length > 0 ? data : fallback();
    } catch {
      return fallback();
    }
  });
}, ["catalog-repair-categories"], {
  revalidate: CATALOG_REVALIDATE_SECONDS,
  tags: ["catalog", "catalog-repair"],
});

async function getRepairSubcategoryPriceVisibility() {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "repair_subcategory_prices")
      .maybeSingle();

    if (error || !data || typeof data.value !== "object" || data.value === null || Array.isArray(data.value)) {
      return true;
    }

    const value = data.value as Record<string, unknown>;
    return value.visible !== false;
  } catch {
    return true;
  }
}

export const getRepairSubcategories = unstable_cache(async (categoryIds: string[], modelId?: string): Promise<RepairSubcategory[]> => {
  if (categoryIds.length === 0) {
    return [];
  }

  const categoryKey = [...categoryIds].sort().join(",");
  const redisKey = `${CATALOG_REDIS_PREFIX}:repair-subcategories:${categoryKey}:${modelId || "all"}`;

  return withRedisCache(redisKey, CATALOG_REVALIDATE_SECONDS, async () => {
    const fallback = () => fallbackRepairSubcategories.filter((subcategory) => categoryIds.includes(subcategory.category_id));

    try {
      const supabase = createPublicClient();
      const { data, error } = await supabase
        .from("repair_subcategories")
        .select("id, category_id, name, image_url, price, sort_order")
        .in("category_id", categoryIds)
        .order("sort_order")
        .order("name");

      if (error || !data) {
        return fallback();
      }

      if (data.length === 0) {
        return fallback();
      }

      const pricesVisible = await getRepairSubcategoryPriceVisibility();

      if (!modelId) {
        return data.map((subcategory) => ({ ...subcategory, price_visible: pricesVisible }));
      }

      const { data: modelPrices, error: modelPriceError } = await supabase
        .from("model_repair_subcategory_prices")
        .select("id, repair_subcategory_id, price")
        .eq("model_id", modelId)
        .in("repair_subcategory_id", data.map((subcategory) => subcategory.id));

      if (modelPriceError || !modelPrices) {
        return data.map((subcategory) => ({ ...subcategory, price_visible: pricesVisible }));
      }

      const modelPriceMap = new Map(modelPrices.map((price) => [price.repair_subcategory_id, price]));

      return data.map((subcategory) => {
        const modelPrice = modelPriceMap.get(subcategory.id);

        return {
          ...subcategory,
          base_price: subcategory.price,
          model_price_id: modelPrice?.id ?? null,
          has_model_price: Boolean(modelPrice),
          price: modelPrice ? Number(modelPrice.price) : subcategory.price,
          price_visible: pricesVisible,
        };
      });
    } catch {
      return fallback();
    }
  });
}, ["catalog-repair-subcategories"], {
  revalidate: CATALOG_REVALIDATE_SECONDS,
  tags: ["catalog", "catalog-repair"],
});

export const getCatalogSearchIndex = unstable_cache(async (serviceType: "mobile" | "laptop"): Promise<CatalogSearchIndex> => {
  return withRedisCache(`${CATALOG_REDIS_PREFIX}:search-index:${serviceType}`, CATALOG_REVALIDATE_SECONDS, async () => {
    try {
      const brands = await getBrandsForListing(serviceType);

      if (brands.length === 0) {
        return { brands: [], series: [], models: [] };
      }

      const supabase = createPublicClient();
      const brandIds = brands.map((brand) => brand.id);
      const brandMap = new Map(brands.map((brand) => [brand.id, brand]));

      const seriesWithSlug = await supabase
        .from("series")
        .select("id, brand_id, name, slug")
        .in("brand_id", brandIds)
        .order("name");

      const seriesRows =
        !seriesWithSlug.error && seriesWithSlug.data
          ? seriesWithSlug.data
          : (
              await supabase
                .from("series")
                .select("id, brand_id, name")
                .in("brand_id", brandIds)
                .order("name")
            ).data ?? [];

      const series = seriesRows
        .map((seriesItem) => {
          const brand = brandMap.get(seriesItem.brand_id);
          if (!brand) {
            return null;
          }

          return {
            id: seriesItem.id,
            brand_id: seriesItem.brand_id,
            brand_name: brand.name,
            brand_slug: brand.slug,
            name: seriesItem.name,
            slug: ("slug" in seriesItem && typeof seriesItem.slug === "string" ? seriesItem.slug : null) || slugify(seriesItem.name) || seriesItem.id,
          } satisfies SearchSeries;
        })
        .filter((item): item is SearchSeries => item !== null);

      if (series.length === 0) {
        return { brands, series: [], models: [] };
      }

      const seriesIds = series.map((seriesItem) => seriesItem.id);
      const seriesMap = new Map(series.map((seriesItem) => [seriesItem.id, seriesItem]));

      const modelsWithSlug = await supabase
        .from("models")
        .select("id, series_id, name, slug")
        .in("series_id", seriesIds)
        .order("name");

      const modelRows =
        !modelsWithSlug.error && modelsWithSlug.data
          ? modelsWithSlug.data
          : (
              await supabase
                .from("models")
                .select("id, series_id, name")
                .in("series_id", seriesIds)
                .order("name")
            ).data ?? [];

      const models = modelRows
        .map((modelItem) => {
          const seriesItem = seriesMap.get(modelItem.series_id);
          if (!seriesItem) {
            return null;
          }

          return {
            id: modelItem.id,
            series_id: modelItem.series_id,
            series_name: seriesItem.name,
            series_slug: seriesItem.slug,
            brand_name: seriesItem.brand_name,
            brand_slug: seriesItem.brand_slug,
            name: modelItem.name,
            slug: ("slug" in modelItem && typeof modelItem.slug === "string" ? modelItem.slug : null) || slugify(modelItem.name) || modelItem.id,
          } satisfies SearchModel;
        })
        .filter((item): item is SearchModel => item !== null);

      return { brands, series, models };
    } catch {
      return { brands: [], series: [], models: [] };
    }
  });
}, ["catalog-search-index-v2"], {
  revalidate: CATALOG_REVALIDATE_SECONDS,
  tags: ["catalog", "catalog-brands", "catalog-series", "catalog-models"],
});
