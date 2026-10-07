import type { Metadata } from "next";
import ServicePage from "@/app/service/[serviceType]/page";
import { buildPageMetadata } from "@/src/lib/metadata";

export const revalidate = 300;

export const metadata: Metadata = buildPageMetadata({
  title: "Doorstep Mobile Repair in Bangalore | Screen & Battery Replacement – Looplic",
  description:
    "Fast doorstep mobile phone repair in Bangalore. Screen replacement, battery replacement, motherboard repairs at home or office. Physical inspection and warranty on eligible repairs.",
  pathname: "/mobile-repair-bangalore",
  keywords: [
    "mobile repair Bangalore",
    "doorstep mobile repair Bangalore",
    "phone screen repair Bangalore",
    "phone battery replacement Bangalore",
    "mobile service center Bangalore",
  ],
});

export default async function Page() {
  return <ServicePage params={Promise.resolve({ serviceType: "mobile-repair" })} />;
}
