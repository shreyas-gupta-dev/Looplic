import type { Metadata } from "next";
import CctvServicePage from "@/app/service/cctv/page";
import { buildPageMetadata } from "@/src/lib/metadata";

export const revalidate = 300;

export const metadata: Metadata = buildPageMetadata({
  title: "CCTV Installation in Bangalore | Doorstep Security Camera Setup – Looplic",
  description:
    "Professional CCTV camera installation in Bangalore for homes, shops & offices. Hikvision, CP Plus, Dahua setup, mobile live view config, and DVR/NVR setup at your doorstep.",
  pathname: "/cctv-installation-bangalore",
  keywords: [
    "CCTV installation Bangalore",
    "security camera setup Bangalore",
    "CP plus installation Bangalore",
    "Hikvision camera installation Bangalore",
    "CCTV repair Bangalore",
  ],
});

export default function Page() {
  return <CctvServicePage />;
}
