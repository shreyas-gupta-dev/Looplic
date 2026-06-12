import { unstable_cache } from "next/cache";

import { withRedisCache } from "@/src/lib/redis";
import { slugify } from "@/src/lib/slug";
import { createPublicClient } from "@/src/lib/data-client/public";

export type HomeBrand = {
  id: string;
  slug: string;
  name: string;
  letter: string;
  gradient: string;
  image_url: string | null;
};

export const HOME_REVALIDATE_SECONDS = 300;

const fallbackBrands: HomeBrand[] = [
  { id: "apple", slug: "apple", name: "Apple", letter: "A", gradient: "from-gray-700 to-gray-900", image_url: null },
  { id: "samsung", slug: "samsung", name: "Samsung", letter: "S", gradient: "from-blue-500 to-blue-700", image_url: null },
  { id: "google", slug: "google", name: "Google", letter: "G", gradient: "from-red-400 to-yellow-400", image_url: null },
  { id: "oneplus", slug: "oneplus", name: "OnePlus", letter: "1+", gradient: "from-red-500 to-red-700", image_url: null },
  { id: "xiaomi", slug: "mi", name: "Mi", letter: "Mi", gradient: "from-orange-400 to-orange-600", image_url: null },
  { id: "vivo", slug: "vivo", name: "V", letter: "V", gradient: "from-blue-400 to-indigo-500", image_url: null },
  { id: "oppo", slug: "oppo", name: "Oppo", letter: "O", gradient: "from-green-400 to-green-600", image_url: null },
  { id: "realme", slug: "realme", name: "Realme", letter: "R", gradient: "from-yellow-400 to-yellow-600", image_url: null },
  { id: "nothing", slug: "nothing", name: "Nothing", letter: "N", gradient: "from-gray-400 to-gray-600", image_url: null },
];

export const getHomepageBrands = unstable_cache(async (): Promise<HomeBrand[]> => {
  return withRedisCache("looplic:home:v1:brands", HOME_REVALIDATE_SECONDS, async () => {
    try {
      const supabase = createPublicClient();
      const withSlug = await supabase
        .from("brands")
        .select("id, slug, name, letter, gradient, image_url")
        .eq("service_type", "mobile")
        .order("sort_order")
        .order("name");

      if (!withSlug.error && withSlug.data && withSlug.data.length > 0) {
        return (withSlug.data as Array<{
          id: string;
          slug: string | null;
          name: string;
          letter: string;
          gradient: string;
          image_url: string | null;
        }>).map((brand) => ({
          ...brand,
          slug: (brand.slug || slugify(brand.name) || brand.id) === "xiaomi" ? "mi" : brand.slug || slugify(brand.name) || brand.id,
          name: (brand.slug || slugify(brand.name) || brand.id) === "xiaomi" ? "Mi" : brand.name,
        }));
      }

      const withoutSlug = await supabase
        .from("brands")
        .select("id, name, letter, gradient, image_url")
        .eq("service_type", "mobile")
        .order("sort_order")
        .order("name");

      if (!withoutSlug.error && withoutSlug.data && withoutSlug.data.length > 0) {
        return (withoutSlug.data as Array<{
          id: string;
          name: string;
          letter: string;
          gradient: string;
          image_url: string | null;
        }>).map((brand) => ({
          ...brand,
          slug: (slugify(brand.name) || brand.id) === "xiaomi" ? "mi" : slugify(brand.name) || brand.id,
          name: (slugify(brand.name) || brand.id) === "xiaomi" ? "Mi" : brand.name,
        }));
      }

      return fallbackBrands;
    } catch {
      return fallbackBrands;
    }
  });
}, ["homepage-brands"], {
  revalidate: HOME_REVALIDATE_SECONDS,
  tags: ["catalog", "catalog-brands", "homepage-brands"],
});
