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

import { getAllListingProducts } from "@/src/lib/data/products";

export default async function BuyPage() {
  const productList = await getAllListingProducts();
  return <BuyListingView products={productList} />;
}
