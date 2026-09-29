import { db } from "@/src/lib/db";
import { products, brands } from "@/src/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { unstable_cache } from "next/cache";

export type FeaturedProduct = {
  id: string;
  name: string;
  slug: string;
  brand: string;
  price: number;
  originalPrice: number;
  storage: string | null;
  color: string | null;
  condition: string;
  coverImageUrl: string | null;
  warrantyMonths: number;
};

export const getFeaturedProducts = unstable_cache(
  async (): Promise<FeaturedProduct[]> => {
    try {
      const rows = await db
        .select({
          id: products.id,
          name: products.name,
          slug: products.slug,
          brandId: products.brandId,
          price: products.price,
          originalPrice: products.originalPrice,
          storage: products.storage,
          color: products.color,
          condition: products.condition,
          coverImageUrl: products.coverImageUrl,
          warrantyMonths: products.warrantyMonths,
          featured: products.featured,
        })
        .from(products)
        .where(eq(products.active, true))
        .orderBy(desc(products.featured), desc(products.createdAt))
        .limit(24);

      if (rows.length === 0) return [];

      const brandIds = [...new Set(rows.map((r) => r.brandId).filter(Boolean))] as string[];
      const brandRows = brandIds.length > 0 ? await db.select().from(brands) : [];
      const brandMap = new Map(brandRows.map((b) => [b.id, b.name]));

      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        brand: r.brandId ? brandMap.get(r.brandId) || "Looplic" : "Looplic",
        price: Number(r.price),
        originalPrice: Number(r.originalPrice),
        storage: r.storage,
        color: r.color,
        condition: r.condition,
        coverImageUrl: r.coverImageUrl,
        warrantyMonths: r.warrantyMonths,
      }));
    } catch (error) {
      console.error("Failed to load featured products:", error);
      return [];
    }
  },
  ["featured-products-home"],
  { revalidate: 300, tags: ["products"] }
);

export type ListingProduct = {
  id: string;
  name: string;
  slug: string;
  brand: string;
  category: string;
  condition: "fair" | "good" | "excellent" | "superb" | "unboxed";
  price: number;
  originalPrice: number;
  storage: string | null;
  ram: string | null;
  color: string | null;
  warrantyMonths: number;
  stock: number;
  featured: boolean;
  coverImageUrl: string | null;
  images: { url: string; alt: string }[];
};

export const getAllListingProducts = unstable_cache(
  async (): Promise<ListingProduct[]> => {
    try {
      const rows = await db
        .select({
          id: products.id,
          name: products.name,
          slug: products.slug,
          brandId: products.brandId,
          category: products.category,
          condition: products.condition,
          price: products.price,
          originalPrice: products.originalPrice,
          storage: products.storage,
          ram: products.ram,
          color: products.color,
          warrantyMonths: products.warrantyMonths,
          stock: products.stock,
          featured: products.featured,
          coverImageUrl: products.coverImageUrl,
        })
        .from(products)
        .where(eq(products.active, true))
        .orderBy(desc(products.featured), desc(products.createdAt));

      if (rows.length === 0) return [];

      const brandIds = [...new Set(rows.map((r) => r.brandId).filter(Boolean))] as string[];
      const brandRows = brandIds.length > 0 ? await db.select().from(brands) : [];
      const brandMap = new Map(brandRows.map((b) => [b.id, b.name]));

      return rows.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        brand: p.brandId ? brandMap.get(p.brandId) || "Other" : "Other",
        category: p.category,
        condition: (p.condition as ListingProduct["condition"]) || "good",
        price: Number(p.price),
        originalPrice: Number(p.originalPrice),
        storage: p.storage,
        ram: p.ram,
        color: p.color,
        warrantyMonths: p.warrantyMonths,
        stock: p.stock,
        featured: p.featured,
        coverImageUrl: p.coverImageUrl,
        images: p.coverImageUrl ? [{ url: p.coverImageUrl, alt: p.name }] : [],
      }));
    } catch (error) {
      console.error("Failed to fetch all listing products:", error);
      return [];
    }
  },
  ["catalog-all-listing-products-v1"],
  { revalidate: 300, tags: ["products"] }
);

export type ProductDetailData = {
  id: string;
  name: string;
  slug: string;
  brand_id: string | null;
  category: string;
  condition: string;
  price: string;
  original_price: string;
  storage: string | null;
  ram: string | null;
  color: string | null;
  description: string | null;
  specifications: Record<string, string> | null;
  warranty_months: number;
  stock: number;
  cover_image_url: string | null;
};

export type ProductDetailImage = {
  id: string;
  product_id: string;
  image_url: string;
  alt_text: string;
  sort_order: number;
};

import { productImages } from "@/src/lib/db/schema";
import { asc } from "drizzle-orm";

export const getProductDetailBySlug = unstable_cache(
  async (slug: string): Promise<{ product: ProductDetailData | null; images: ProductDetailImage[] }> => {
    try {
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.slug, slug))
        .limit(1);

      if (!product) return { product: null, images: [] };

      const images = await db
        .select()
        .from(productImages)
        .where(eq(productImages.productId, product.id))
        .orderBy(asc(productImages.sortOrder));

      const mapped: ProductDetailData = {
        id: product.id,
        name: product.name,
        slug: product.slug,
        brand_id: product.brandId,
        category: product.category,
        condition: product.condition,
        price: product.price,
        original_price: product.originalPrice,
        storage: product.storage,
        ram: product.ram,
        color: product.color,
        description: product.description,
        specifications: product.specifications as Record<string, string> | null,
        warranty_months: product.warrantyMonths,
        stock: product.stock,
        cover_image_url: product.coverImageUrl,
      };

      const mappedImages: ProductDetailImage[] = images.map((img) => ({
        id: img.id,
        product_id: img.productId,
        image_url: img.imageUrl,
        alt_text: img.altText,
        sort_order: img.sortOrder,
      }));

      return { product: mapped, images: mappedImages };
    } catch (error) {
      console.error("Failed to load product detail:", error);
      return { product: null, images: [] };
    }
  },
  ["product-detail-by-slug"],
  { revalidate: 300, tags: ["products"] }
);


