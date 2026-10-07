import type { Metadata } from "next";
import { getAllListingProducts } from "@/src/lib/data/products";
import { BuyListingView } from "@/src/components/next/BuyListingView";
import { buildPageMetadata } from "@/src/lib/metadata";

export const revalidate = 300;

export const metadata: Metadata = buildPageMetadata({
  title: "Buy Refurbished iPhones in Bangalore | Certified Apple Warranty – Looplic",
  description:
    "Buy certified refurbished iPhones in Bangalore at best prices. 100% genuine parts, 32-point inspection, warranty and doorstep delivery across Bangalore.",
  pathname: "/refurbished-iphones-bangalore",
  keywords: [
    "refurbished iPhone Bangalore",
    "buy refurbished iPhone Bangalore",
    "second hand iPhone Bangalore",
    "used iPhone 13 Bangalore",
    "used iPhone 14 Bangalore",
    "certified pre-owned iPhone Bangalore",
  ],
});

export default async function Page() {
  const allProducts = await getAllListingProducts();
  const iphoneProducts = allProducts.filter((p) => p.brand?.toLowerCase() === "apple");
  return <BuyListingView products={iphoneProducts.length > 0 ? iphoneProducts : allProducts} />;
}
