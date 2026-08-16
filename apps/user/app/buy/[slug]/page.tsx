import type { Metadata } from "next";
import { ProductDetailView } from "@/src/components/next/ProductDetailView";
import { buildPageMetadata } from "@/src/lib/metadata";

export const revalidate = 300;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const title = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return buildPageMetadata({
    title: `Buy ${title} - Certified Refurbished`,
    description: `Buy certified refurbished ${title} at up to 70% off with 6-month warranty, free delivery, and 15-day replacement guarantee.`,
    pathname: `/buy/${slug}`,
    keywords: ["buy refurbished", title, "certified pre-owned", "Looplic"],
  });
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  return <ProductDetailView slug={slug} />;
}
