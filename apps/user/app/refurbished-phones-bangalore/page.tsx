import type { Metadata } from "next";
import { getAllListingProducts } from "@/src/lib/data/products";
import { BuyListingView } from "@/src/components/next/BuyListingView";
import { buildPageMetadata } from "@/src/lib/metadata";

export const revalidate = 300;

export const metadata: Metadata = buildPageMetadata({
  title: "Buy Refurbished Phones in Bangalore | Certified with Warranty – Looplic",
  description:
    "Buy certified refurbished mobile phones in Bangalore at up to 70% off. 32-point quality check, warranty included, free delivery across Bangalore. Looplic Assured.",
  pathname: "/refurbished-phones-bangalore",
  keywords: [
    "refurbished phones Bangalore",
    "buy refurbished phone Bangalore",
    "second hand phone Bangalore",
    "used mobile Bangalore",
    "certified pre-owned phones Bangalore",
  ],
});

export default async function Page() {
  const allProducts = await getAllListingProducts();
  const phoneProducts = allProducts.filter(
    (p) => p.category?.toLowerCase() === "phone" || p.category?.toLowerCase() === "mobile"
  );
  return <BuyListingView products={phoneProducts.length > 0 ? phoneProducts : allProducts} />;
}
