import Link from "next/link";

import { bangaloreAreas, buildBangaloreAreaRoute, buildBangaloreAreaServiceRoute } from "@/src/lib/service-areas";
import type { ServiceType } from "@/src/lib/routes";

export function ServiceAreasSection({
  currentAreaSlug,
  currentRepairServiceType,
}: {
  currentAreaSlug?: string;
  currentRepairServiceType?: ServiceType;
}) {
  const mobileRepairHref = currentAreaSlug ? buildBangaloreAreaServiceRoute(currentAreaSlug, "mobile-repair") : "/service/mobile-repair";
  const laptopRepairHref = currentAreaSlug ? buildBangaloreAreaServiceRoute(currentAreaSlug, "laptop-repair") : "/service/laptop-repair";
  const cctvHref = currentAreaSlug ? buildBangaloreAreaServiceRoute(currentAreaSlug, "cctv") : "/service/cctv";

  return (
    <section className="border-t border-border bg-[linear-gradient(180deg,rgba(248,250,252,0.95),rgba(255,255,255,1))] py-12">
      <div className="container max-w-6xl px-4 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[28px] border border-border bg-card p-6 shadow-card-brand">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary/80">Coverage</p>
            <h2 className="mt-3 text-2xl font-semibold leading-tight text-foreground">
              Doorstep Device Repair Areas We Serve
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              We cover core Bangalore neighborhoods with fast mobile repair, laptop repair, and tech support for popular device models.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {bangaloreAreas.map((area) => {
                const isActive = area.slug === currentAreaSlug;

                return (
                  <Link
                    key={area.slug}
                    href={buildBangaloreAreaRoute(area.slug)}
                    className={`rounded-full border px-3 py-2 text-xs font-bold transition-all ${
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-secondary/60 text-foreground hover:border-primary/30 hover:text-primary"
                    }`}
                  >
                    {area.name}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="rounded-[28px] border border-border bg-card p-6 shadow-card-brand">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary/80">Repair Coverage</p>
            <h2 className="mt-3 text-2xl font-semibold leading-tight text-foreground">
              Doorstep Repair Pickup and Delivery Available in Bangalore
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Pickup, doorstep repair, CCTV installation, and tech support are available across Bangalore. Use the service pages below to start the right flow.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href={mobileRepairHref}
                className="rounded-full border border-border bg-card px-4 py-2 text-xs font-bold text-foreground transition-all hover:border-primary/30 hover:text-primary"
              >
                Mobile Repair
              </Link>
              <Link
                href={laptopRepairHref}
                className="rounded-full border border-border bg-card px-4 py-2 text-xs font-bold text-foreground transition-all hover:border-primary/30 hover:text-primary"
              >
                Laptop Repair
              </Link>
              <Link
                href={cctvHref}
                className="rounded-full border border-border bg-card px-4 py-2 text-xs font-bold text-foreground transition-all hover:border-primary/30 hover:text-primary"
              >
                CCTV Installation
              </Link>
            </div>
            {currentRepairServiceType ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {bangaloreAreas.map((area) => {
                  const isActive = area.slug === currentAreaSlug;

                  return (
                    <Link
                      key={`repair-${area.slug}`}
                      href={buildBangaloreAreaServiceRoute(area.slug, currentRepairServiceType)}
                      className={`rounded-full border px-3 py-2 text-xs font-bold transition-all ${
                        isActive
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-secondary/60 text-foreground hover:border-primary/30 hover:text-primary"
                      }`}
                    >
                      {area.name}
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
