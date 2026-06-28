import { Suspense } from "react";

import type {
  CatalogBrand,
  CatalogModel,
  CatalogSeries,
  ModelScreenGuard,
  RepairCategory,
  RepairSubcategory,
} from "@/src/lib/data/catalog";

import { UniversalBookingFlow } from "@/src/components/next/UniversalBookingFlow";
import { CatalogNavbar } from "@/src/components/next/CatalogNavbar";
import { CatalogServiceTabs } from "@/src/components/next/CatalogServiceTabs";
import { HomepageFooter } from "@/src/components/next/HomepageFooter";

type BookingPageShellProps = {
  brand: CatalogBrand;
  series: CatalogSeries;
  model: CatalogModel;
  activeTab: "mobile-repair" | "laptop-repair";
  basePath: string;
  isRepair: boolean;
  repairServiceType?: "mobile" | "laptop";
  guards?: ModelScreenGuard[];
  repairCategories?: RepairCategory[];
  repairSubcategories?: RepairSubcategory[];
};

export function BookingPageShell({
  brand,
  series,
  model,
  activeTab,
  basePath,
  isRepair,
  repairServiceType,
  guards = [],
  repairCategories = [],
  repairSubcategories = [],
}: BookingPageShellProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <CatalogNavbar />
      <CatalogServiceTabs active={activeTab} />
      <div className="flex-1 pb-14 sm:pb-20 lg:pb-24">
        <Suspense
        fallback={
          <main className="flex flex-1 items-center justify-center p-6">
            <div className="text-sm text-muted-foreground">Loading booking flow&hellip;</div>
          </main>
        }
      >
          <UniversalBookingFlow
            serviceSlug={activeTab}
            brand={brand}
            series={series}
            model={model}
            basePath={basePath}
            isRepair={isRepair}
            repairServiceType={repairServiceType}
            guards={guards}
            repairCategories={repairCategories}
            repairSubcategories={repairSubcategories}
          />
        </Suspense>
      </div>
      <HomepageFooter />
    </div>
  );
}
