import { cctvBrandOptions, cctvServiceOptions } from "@/src/lib/cctv-booking";

// Option sets for the WhatsApp wizard. These MIRROR the constants inside
// apps/user/src/components/next/UniversalBookingFlow.tsx — the website's
// booking form. Keep the two in sync: if a slot or a spec option changes on the
// website it must change here, otherwise WhatsApp customers get choices the
// technicians' scheduling doesn't recognise.

export const TIME_SLOTS = ["8 AM - 11 AM", "11 AM - 2 PM", "2 PM - 5 PM", "5 PM - 8 PM"] as const;

export const RAM_OPTIONS = ["4 GB", "8 GB", "16 GB", "32 GB", "64 GB"] as const;
export const STORAGE_OPTIONS = ["HDD", "SSD", "NVMe SSD"] as const;
export const OS_OPTIONS = ["Windows", "macOS", "Linux", "Other"] as const;

export const CAMERA_COUNT_OPTIONS = ["1 – 2", "3 – 4", "5 – 8", "8+"] as const;
export const LOCATION_TYPE_OPTIONS = ["Indoor only", "Outdoor only", "Indoor + Outdoor"] as const;
export const DVR_OPTIONS = ["DVR (analog cameras)", "NVR (IP cameras)", "Not sure / Need advice"] as const;

export { cctvBrandOptions, cctvServiceOptions };

// The top-level service menu, mirroring what looplic.com offers. `kind` picks
// the wizard branch; `dbServiceType` is what lands in bookings.service_type.
export type ServiceMenuEntry = {
  id: string;
  title: string; // ≤ 24 chars (WhatsApp list row limit)
  description: string;
  kind: "repair" | "guard" | "cctv" | "simple" | "sell";
  dbServiceType: string;
  catalogType?: "mobile" | "laptop";
};

export const SERVICE_MENU: ServiceMenuEntry[] = [
  {
    id: "mobile_repair",
    title: "📱 Mobile repair",
    description: "Doorstep phone repair with exact prices",
    kind: "repair",
    dbServiceType: "mobile_repair",
    catalogType: "mobile",
  },
  {
    id: "laptop_repair",
    title: "💻 Laptop repair",
    description: "Doorstep laptop repair and diagnostics",
    kind: "repair",
    dbServiceType: "laptop_repair",
    catalogType: "laptop",
  },
  {
    id: "screen_guard",
    title: "🛡 Screen guard",
    description: "Premium guards fitted at your door",
    kind: "guard",
    dbServiceType: "screen_guard",
    catalogType: "mobile",
  },
  {
    id: "sell",
    title: "💰 Sell a device",
    description: "Instant quote and free pickup",
    kind: "sell",
    dbServiceType: "buyback",
  },
  {
    id: "cctv",
    title: "🎥 CCTV",
    description: "Installation, repair, AMC and upgrades",
    kind: "cctv",
    dbServiceType: "cctv",
  },
  {
    id: "it_support",
    title: "🛠 IT support",
    description: "On-site IT help for home and office",
    kind: "simple",
    dbServiceType: "it_support",
  },
  {
    id: "desktop_assembly",
    title: "🖥 Desktop assembly",
    description: "Custom PC build and setup",
    kind: "simple",
    dbServiceType: "desktop_assembly",
  },
  {
    id: "managed_it_services",
    title: "🏢 Managed IT",
    description: "Ongoing IT management for business",
    kind: "simple",
    dbServiceType: "managed_it_services",
  },
  {
    id: "wifi_network_installation",
    title: "📶 WiFi / networking",
    description: "WiFi and network installation",
    kind: "simple",
    dbServiceType: "wifi_network_installation",
  },
];

// Categories that can be sold back (the website's Sell flow covers all five).
export const SELL_CATEGORIES = [
  { id: "mobile", title: "📱 Mobile phone" },
  { id: "laptop", title: "💻 Laptop" },
  { id: "tablet", title: "📲 Tablet" },
  { id: "smartwatch", title: "⌚ Smartwatch" },
  { id: "audio", title: "🎧 Audio" },
] as const;

export const SERVICE_LABELS: Record<string, string> = {
  mobile_repair: "Mobile Repair",
  laptop_repair: "Laptop Repair",
  screen_guard: "Screen Guard",
  cctv: "CCTV Installation",
  desktop_assembly: "Desktop Assembly",
  it_support: "IT Support",
  managed_it_services: "Managed IT Services",
  wifi_network_installation: "WiFi Network Installation",
  buyback: "Device Buyback",
};
