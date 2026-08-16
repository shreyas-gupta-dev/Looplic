import type { Metadata } from "next";
import { CheckoutPageView } from "@/src/components/next/CheckoutPageView";
import { buildPageMetadata } from "@/src/lib/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Checkout",
  description: "Complete your purchase with secure payment.",
  pathname: "/checkout",
});

export default function CheckoutPage() {
  return <CheckoutPageView />;
}
