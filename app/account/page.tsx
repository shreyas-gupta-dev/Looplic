import type { Metadata } from "next";

import { AccountPageClient } from "@/src/components/next/AccountPageClient";
import { CatalogNavbar } from "@/src/components/next/CatalogNavbar";
import { HomepageFooter } from "@/src/components/next/HomepageFooter";
import { buildPageMetadata } from "@/src/lib/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "My Looplic Account",
  description: "View your Looplic bookings, check order status, and manage your account details in one place.",
  pathname: "/account",
  noIndex: true,
});

export default function AccountPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <CatalogNavbar />
      <AccountPageClient />
      <HomepageFooter />
    </div>
  );
}
