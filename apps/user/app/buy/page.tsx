import type { Metadata } from "next";
import { db } from "@/src/lib/db";
import { products, productImages, brands } from "@/src/lib/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { BuyListingView } from "@/src/components/next/BuyListingView";
import { buildPageMetadata } from "@/src/lib/metadata";

export const revalidate = 300;

export const metadata: Metadata = buildPageMetadata({
  title: "Buy Refurbished Phones & Laptops",
  description:
    "Buy certified refurbished phones, laptops, and tablets at up to 70% off. 6-month warranty, free delivery, 15-day replacement guarantee.",
  pathname: "/buy",
  keywords: ["buy refurbished phone", "buy used phone", "refurbished laptop", "certified pre-owned", "Looplic"],
});

async function getProducts() {
  try {
    const rows = await db
      .select()
      .from(products)
      .where(eq(products.active, true))
      .orderBy(desc(products.featured), desc(products.createdAt));

    // Fetch images for all products
    const productIds = rows.map((r) => r.id);
    const images =
      productIds.length > 0
        ? await db.select().from(productImages).orderBy(asc(productImages.sortOrder))
        : [];

    // Group images by product
    const imageMap = new Map<string, typeof images>();
    for (const img of images) {
      const existing = imageMap.get(img.productId) || [];
      existing.push(img);
      imageMap.set(img.productId, existing);
    }

    // Get unique brand IDs to attach brand names
    const brandIds = [...new Set(rows.filter((r) => r.brandId).map((r) => r.brandId!))];
    const brandRows =
      brandIds.length > 0
        ? await db.select().from(brands)
        : [];
    const brandMap = new Map(brandRows.map((b) => [b.id, b.name]));

    return rows.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      brand: p.brandId ? brandMap.get(p.brandId) || "Unknown" : "Unknown",
      category: p.category,
      condition: p.condition,
      price: Number(p.price),
      originalPrice: Number(p.originalPrice),
      storage: p.storage,
      ram: p.ram,
      color: p.color,
      description: p.description,
      specifications: p.specifications as Record<string, string> | null,
      warrantyMonths: p.warrantyMonths,
      stock: p.stock,
      featured: p.featured,
      coverImageUrl: p.coverImageUrl,
      images: (imageMap.get(p.id) || []).map((img) => ({
        url: img.imageUrl,
        alt: img.altText,
      })),
    }));
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return [];
  }
}

export default async function BuyPage() {
  const productList = await getProducts();
  return <BuyListingView products={productList} />;
}
