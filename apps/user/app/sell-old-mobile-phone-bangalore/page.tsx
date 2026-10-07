import type { Metadata } from "next";
import SellBrandsPage from "@/app/sell/[category]/page";
import { buildPageMetadata } from "@/src/lib/metadata";

export const revalidate = 300;

export const metadata: Metadata = buildPageMetadata({
  title: "Sell Old Mobile Phone in Bangalore | Instant Payment – Looplic",
  description:
    "Sell your old mobile phone in Bangalore. Get an estimated resale value in 60s, free doorstep pickup, device inspection before final offer, and instant UPI/Bank payment.",
  pathname: "/sell-old-mobile-phone-bangalore",
  keywords: [
    "sell old phone Bangalore",
    "sell old mobile phone Bangalore",
    "sell used mobile Bangalore",
    "mobile buyback Bangalore",
    "instant payment phone Bangalore",
  ],
});

export default async function Page() {
  return <SellBrandsPage params={Promise.resolve({ category: "phone" })} />;
}
