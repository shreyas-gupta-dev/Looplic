import type { Metadata } from "next";
import ServicePage from "@/app/service/[serviceType]/page";
import { buildPageMetadata } from "@/src/lib/metadata";

export const revalidate = 300;

export const metadata: Metadata = buildPageMetadata({
  title: "Doorstep Laptop Repair in Bangalore | Screen, Battery & Keyboard – Looplic",
  description:
    "Expert laptop and MacBook repair in Bangalore at your doorstep. Keyboard, screen, battery replacement, SSD upgrades, and motherboard repairs with warranty on eligible repairs.",
  pathname: "/laptop-repair-bangalore",
  keywords: [
    "laptop repair Bangalore",
    "doorstep laptop service Bangalore",
    "MacBook repair Bangalore",
    "laptop screen replacement Bangalore",
    "laptop battery replacement Bangalore",
  ],
});

export default async function Page() {
  return <ServicePage params={Promise.resolve({ serviceType: "laptop-repair" })} />;
}
