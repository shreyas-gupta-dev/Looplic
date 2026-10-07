import type { Metadata } from "next";
import { buildPageMetadata } from "@/src/lib/metadata";
import { SeoServicePage } from "@/src/components/next/SeoServicePage";

export const revalidate = 300;

export const metadata: Metadata = buildPageMetadata({
  title: "Doorstep iPhone Repair in Bangalore | Screen & Battery Replacement – Looplic",
  description:
    "Professional doorstep Apple iPhone repair in Bangalore. Screen replacement, battery replacement, camera and charging fixes with physical inspection and warranty on eligible repairs.",
  pathname: "/iphone-repair-bangalore",
  keywords: [
    "iPhone repair Bangalore",
    "doorstep iPhone repair Bangalore",
    "iPhone screen replacement Bangalore",
    "iPhone battery replacement Bangalore",
    "Apple service center Bangalore",
  ],
});

export default function Page() {
  return <SeoServicePage slug="apple-iphone-screen-replacement" />;
}
