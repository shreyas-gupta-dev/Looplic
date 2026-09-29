import type { Metadata } from "next";
import { Suspense } from "react";

import { CatalogNavbar } from "@/src/components/next/CatalogNavbar";
import { HomepageFooter } from "@/src/components/next/HomepageFooter";
import { ResetPasswordClient } from "@/src/components/next/ResetPasswordClient";
import { buildPageMetadata } from "@/src/lib/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Reset Your Looplic Password",
  description: "Request a password reset link or set a new password for your Looplic account.",
  pathname: "/auth/reset-password",
  noIndex: true,
});

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <CatalogNavbar />
      <Suspense
        fallback={
          <main className="flex flex-1 items-center justify-center p-4">
            <div className="text-sm text-muted-foreground">Loading password reset&hellip;</div>
          </main>
        }
      >
        <ResetPasswordClient />
      </Suspense>
      <HomepageFooter />
    </div>
  );
}
