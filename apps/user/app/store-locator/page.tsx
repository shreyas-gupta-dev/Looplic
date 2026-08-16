import type { Metadata } from "next";
import { buildPageMetadata } from "@/src/lib/metadata";
import { StoreLocatorView } from "@/src/components/next/StoreLocatorView";

export const metadata: Metadata = buildPageMetadata({
  title: "Store Locator - Find a Looplic Store Near You",
  description: "Find your nearest Looplic store for instant device evaluation, sell your old phone in-store, or buy certified refurbished devices. Walk-in welcome.",
  pathname: "/store-locator",
  keywords: ["Looplic store", "store locator", "sell phone near me", "refurbished store", "Looplic location"],
});

export default function StoreLocatorPage() {
  return <StoreLocatorView />;
}
