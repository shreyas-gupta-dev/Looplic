import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthPageClient } from "@/src/components/next/AuthPageClient";
import { CatalogNavbar } from "@/src/components/next/CatalogNavbar";
import { HomepageFooter } from "@/src/components/next/HomepageFooter";
import { buildPageMetadata } from "@/src/lib/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Sign In to Looplic",
  description: "Sign in or create a Looplic account to manage bookings, track orders, and access your device service details.",
  pathname: "/auth",
  noIndex: true,
});

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <CatalogNavbar />
      <Suspense
        fallback={
          <main className="flex flex-1 items-center justify-center p-4">
            <div className="text-sm text-muted-foreground">Loading account access&hellip;</div>
          </main>
        }
      >
        <AuthPageClient />
      </Suspense>
      <HomepageFooter />
    </div>
  );
}
