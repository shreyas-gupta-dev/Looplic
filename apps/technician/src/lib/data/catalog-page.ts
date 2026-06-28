import { cache } from "react";

import {
  getBrandBySlug,
  getModelBySlug,
  getRepairCategories,
  getRepairSubcategories,
  getSeriesBySlug,
  type CatalogBrand,
  type CatalogModel,
  type CatalogSeries,
  type RepairCategory,
  type RepairSubcategory,
} from "@/src/lib/data/catalog";

type ListingType = "mobile" | "laptop";

type BrandPageData = {
  brand: CatalogBrand | null;
};

type SeriesPageData = {
  brand: CatalogBrand | null;
  series: CatalogSeries | null;
};

type ModelPageData = {
  brand: CatalogBrand | null;
  series: CatalogSeries | null;
  model: CatalogModel | null;
};

type RepairCatalogData = {
  repairCategories: RepairCategory[];
  repairSubcategories: RepairSubcategory[];
};

export const resolveBrandPageData = cache(async (brandSlug: string, listingType: ListingType): Promise<BrandPageData> => {
  const brand = await getBrandBySlug(brandSlug, listingType);
  return { brand };
});

export const resolveSeriesPageData = cache(async (brandSlug: string, seriesSlug: string, listingType: ListingType): Promise<SeriesPageData> => {
  const brand = await getBrandBySlug(brandSlug, listingType);

  if (!brand) {
    return { brand: null, series: null };
  }

  const series = await getSeriesBySlug(brand.id, seriesSlug);
  return { brand, series };
});

export const resolveModelPageData = cache(async (brandSlug: string, seriesSlug: string, modelSlug: string, listingType: ListingType): Promise<ModelPageData> => {
  const { brand, series } = await resolveSeriesPageData(brandSlug, seriesSlug, listingType);

  if (!brand || !series) {
    return { brand, series, model: null };
  }

  const model = await getModelBySlug(series.id, modelSlug);
  return { brand, series, model };
});

export const getRepairCatalogData = cache(async (listingType: ListingType, modelId?: string): Promise<RepairCatalogData> => {
  const repairCategories = await getRepairCategories(listingType);
  const repairSubcategories = await getRepairSubcategories(repairCategories.map((category) => category.id), modelId);

  return {
    repairCategories,
    repairSubcategories,
  };
});
