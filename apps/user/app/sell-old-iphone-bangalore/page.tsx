import type { Metadata } from "next";
import SellSeriesPage from "@/app/sell/[category]/[brandSlug]/page";
import { buildPageMetadata } from "@/src/lib/metadata";

export const revalidate = 300;

export const metadata: Metadata = buildPageMetadata({
  title: "Sell Old iPhone in Bangalore | Instant Payment – Looplic",
  description:
    "Sell your old Apple iPhone in Bangalore with Looplic. Get an estimated resale value in 60s, free doorstep pickup across Bangalore, device inspection before final offer, and instant UPI/Bank payment.",
  pathname: "/sell-old-iphone-bangalore",
  keywords: [
    "sell old iPhone Bangalore",
    "sell used iPhone Bangalore",
    "iPhone buyback Bangalore",
    "sell iPhone 15 Bangalore",
    "sell iPhone 14 Bangalore",
    "doorstep iPhone sell Bangalore",
  ],
});

export default async function Page() {
  return <SellSeriesPage params={Promise.resolve({ category: "phone", brandSlug: "apple" })} />;
}
