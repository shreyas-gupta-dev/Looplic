import type { Metadata } from "next";
import { buildPageMetadata } from "@/src/lib/metadata";
import { SeoServicePage } from "@/src/components/next/SeoServicePage";

export const revalidate = 300;

export const metadata: Metadata = buildPageMetadata({
  title: "Doorstep Samsung Repair in Bangalore | Galaxy Screen & Battery – Looplic",
  description:
    "Expert doorstep Samsung Galaxy repair in Bangalore. Screen replacement, battery swap, charging port and camera repairs with inspection before final quote and warranty.",
  pathname: "/samsung-repair-bangalore",
  keywords: [
    "Samsung repair Bangalore",
    "Samsung screen replacement Bangalore",
    "Galaxy repair Bangalore",
    "doorstep Samsung mobile service Bangalore",
  ],
});

export default function Page() {
  return <SeoServicePage slug="samsung-screen-replacement" />;
}
