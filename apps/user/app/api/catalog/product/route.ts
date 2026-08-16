import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import { products, productImages } from "@/src/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  try {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);

    if (!product) return NextResponse.json({ product: null, images: [] });

    const images = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, product.id))
      .orderBy(asc(productImages.sortOrder));

    // Convert to snake_case for consistency with the client component
    const mapped = {
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
      specifications: product.specifications,
      warranty_months: product.warrantyMonths,
      stock: product.stock,
      cover_image_url: product.coverImageUrl,
    };

    const mappedImages = images.map((img) => ({
      id: img.id,
      product_id: img.productId,
      image_url: img.imageUrl,
      alt_text: img.altText,
      sort_order: img.sortOrder,
    }));

    return NextResponse.json({ product: mapped, images: mappedImages });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
