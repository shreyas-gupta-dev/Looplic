import { Loader2, Wrench } from "lucide-react";

import { CatalogNavbar } from "@/src/components/next/CatalogNavbar";
import { HomepageFooter } from "@/src/components/next/HomepageFooter";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <CatalogNavbar />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-5 text-center shadow-card-brand">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Loader2 className="size-6 animate-spin" />
          </div>
          <h1 className="mt-4 text-lg font-black text-foreground">Loading services</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Getting repair options and prices for your selected model.</p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[0, 1, 2].map((item) => (
              <div key={item} className="flex h-16 items-center justify-center rounded-2xl bg-secondary/70">
                <Wrench className="size-5 text-muted-foreground/50" />
              </div>
            ))}
          </div>
        </div>
      </main>
      <HomepageFooter />
    </div>
  );
}
