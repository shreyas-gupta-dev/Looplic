import { HowItWorks } from "@/src/components/next/HowItWorks";
import { HomepageBrandGrid } from "@/src/components/next/HomepageBrandGrid";
import { HomepageFooter } from "@/src/components/next/HomepageFooter";
import { HomepageHeroSection } from "@/src/components/next/HomepageHeroSection";
import { HomepageNavbar } from "@/src/components/next/HomepageNavbar";
import { HomepageServiceTabs } from "@/src/components/next/HomepageServiceTabs";
import { ServiceAreasSection } from "@/src/components/next/ServiceAreasSection";
import { TrustSignals } from "@/src/components/next/TrustSignals";
import type { CatalogBrand, SearchModel, SearchSeries } from "@/src/lib/data/catalog";

export function HomepageView({
  brands,
  searchBrands,
  searchSeries,
  searchModels,
  heroTitle,
  heroDescription,
  heroEyebrow,
  heroBrowseHref,
  heroSearchPlaceholder,
  currentAreaSlug,
  mobileRepairOnly = false,
}: {
  brands: CatalogBrand[];
  searchBrands: CatalogBrand[];
  searchSeries: SearchSeries[];
  searchModels: SearchModel[];
  heroTitle?: string;
  heroDescription?: string;
  heroEyebrow?: string;
  heroBrowseHref?: string;
  heroSearchPlaceholder?: string;
  currentAreaSlug?: string;
  mobileRepairOnly?: boolean;
}) {
  return (
    <div className="min-h-screen bg-background">
      <HomepageNavbar />
      <HomepageServiceTabs currentAreaSlug={currentAreaSlug} mobileRepairOnly={mobileRepairOnly} />
      <HomepageHeroSection
        brands={brands.slice(0, 6)}
        searchBrands={searchBrands}
        searchSeries={searchSeries}
        searchModels={searchModels}
        title={heroTitle}
        description={heroDescription}
        eyebrow={heroEyebrow}
        browseHref={heroBrowseHref}
        searchPlaceholder={heroSearchPlaceholder}
      />
      <HomepageBrandGrid brands={brands} />
      <HowItWorks />
      <TrustSignals />
      <HomepageFooter />
      <ServiceAreasSection currentAreaSlug={currentAreaSlug} />
    </div>
  );
}
