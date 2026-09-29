import type { Metadata } from "next";
import { ProductDetailView } from "@/src/components/next/ProductDetailView";
import { buildPageMetadata } from "@/src/lib/metadata";
import { getProductDetailBySlug } from "@/src/lib/data/products";

export const revalidate = 300;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { product } = await getProductDetailBySlug(slug);

  const title = product?.name || slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const description = product?.description
    ? `${product.description.slice(0, 160)}... Buy certified refurbished with warranty at Looplic.`
    : `Buy certified refurbished ${title} at up to 70% off with 6-month warranty, free delivery, and 15-day replacement guarantee.`;

  return buildPageMetadata({
    title: `Buy ${title} - Certified Refurbished`,
    description,
    pathname: `/buy/${slug}`,
    keywords: ["buy refurbished", title, "certified pre-owned", "Looplic"],
  });
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const { product, images } = await getProductDetailBySlug(slug);
  return <ProductDetailView slug={slug} initialProduct={product} initialImages={images} />;
}
