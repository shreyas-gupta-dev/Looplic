import type { Metadata } from "next";
import { CartPageView } from "@/src/components/next/CartPageView";
import { buildPageMetadata } from "@/src/lib/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Your Cart",
  description: "Review items in your cart and proceed to checkout.",
  pathname: "/cart",
});

export default function CartPage() {
  return <CartPageView />;
}
