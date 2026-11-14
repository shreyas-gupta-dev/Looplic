import type { Metadata } from "next";
import { db } from "@/src/lib/db";
import { products, productImages, brands } from "@/src/lib/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { BuyListingView } from "@/src/components/next/BuyListingView";
import { buildPageMetadata } from "@/src/lib/metadata";
import {
  buildBreadcrumbSchema,
  buildCollectionPageSchema,
} from "@/src/lib/schema";

export const revalidate = 300;

export const metadata: Metadata = buildPageMetadata({
  title: "Buy Refurbished Phones & Laptops",
  description:
    "Buy certified refurbished phones, laptops, and tablets at up to 70% off. 6-month warranty, free delivery, and 7-day replacement window.",
  pathname: "/buy",
  keywords: ["buy refurbished phone", "buy used phone", "refurbished laptop", "certified pre-owned", "Looplic"],
});

import { getAllListingProducts } from "@/src/lib/data/products";

export default async function BuyPage() {
  const productList = await getAllListingProducts();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              buildCollectionPageSchema({
                name: "Buy Certified Refurbished Phones & Laptops",
                description:
                  "Buy certified refurbished phones, laptops, and tablets at up to 70% off with 6-month warranty and 7-day replacement window.",
                path: "/buy",
              }),
              buildBreadcrumbSchema([
                { name: "Home", path: "/" },
                { name: "Buy Refurbished", path: "/buy" },
              ]),
            ],
          }),
        }}
      />
      <BuyListingView products={productList} />
    </>
  );
}
