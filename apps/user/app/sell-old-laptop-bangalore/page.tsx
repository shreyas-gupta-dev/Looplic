import type { Metadata } from "next";
import SellBrandsPage from "@/app/sell/[category]/page";
import { buildPageMetadata } from "@/src/lib/metadata";

export const revalidate = 300;

export const metadata: Metadata = buildPageMetadata({
  title: "Sell Old Laptop in Bangalore | Instant Payment – Looplic",
  description:
    "Sell your old laptop in Bangalore with Looplic. Get an estimated resale value in 60s, free doorstep pickup across Bangalore, device inspection before final offer, and instant UPI/Bank payment.",
  pathname: "/sell-old-laptop-bangalore",
  keywords: [
    "sell old laptop Bangalore",
    "sell used laptop Bangalore",
    "laptop buyback Bangalore",
    "sell macbook Bangalore",
    "doorstep laptop pickup Bangalore",
  ],
});

export default async function Page() {
  return <SellBrandsPage params={Promise.resolve({ category: "laptop" })} />;
}
