import type { Metadata } from "next";
import { ArrowRight, Camera, Check, Wrench } from "lucide-react";
import Link from "next/link";

import { CatalogNavbar } from "@/src/components/next/CatalogNavbar";
import { HomepageFooter } from "@/src/components/next/HomepageFooter";
import { buildCctvBookingHref, buildCctvBrandSelectionHref, cctvBrandOptions, cctvServiceOptions, getCctvServiceLabel, isCctvServiceValue } from "@/src/lib/cctv-booking";
import { buildPageMetadata } from "@/src/lib/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Choose CCTV Brand | Looplic CCTV Booking",
  description: "Select your CCTV service and brand before booking installation, repair, upgrade, relocation, or AMC support.",
  pathname: "/service/cctv/brands",
});

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

export default async function CctvBrandSelectionPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const requestedService = getParamValue(params.cctv_service);
  const selectedService = isCctvServiceValue(requestedService) ? requestedService : "";
  const selectedServiceLabel = getCctvServiceLabel(selectedService);

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC]">
      <CatalogNavbar />
      <main className="flex-1">
        <section className="border-b border-slate-200 bg-[#EEF4F8] px-4 py-10 sm:py-14">
          <div className="container mx-auto max-w-3xl">
            <div className="mb-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-extrabold uppercase tracking-[0.18em] text-[#0096FF] shadow-sm">
              CCTV Booking
            </div>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight text-[#111827] sm:text-5xl">
              {selectedService ? "Choose your CCTV brand" : "Choose your CCTV service"}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              {selectedService
                ? `Selected service: ${selectedServiceLabel}. Pick the CCTV brand so we can carry it into your booking.`
                : "Select the CCTV service first, then choose the brand before moving to the booking form."}
            </p>
          </div>
        </section>

        <section className="container mx-auto max-w-3xl px-4 py-10">
          {!selectedService ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {cctvServiceOptions.map((service) => (
                <Link
                  key={service.value}
                  href={buildCctvBrandSelectionHref(service.value)}
                  className="group flex items-center justify-between rounded-[20px] border border-gray-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(15,23,42,0.12)] sm:rounded-3xl sm:p-5"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex size-11 items-center justify-center rounded-2xl bg-emerald-50">
                      <Wrench className="size-5 text-emerald-500" />
                    </span>
                    <span className="text-sm font-extrabold text-gray-900">{service.label}</span>
                  </span>
                  <ArrowRight className="size-4 text-gray-400 transition-colors group-hover:text-gray-900" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
              {cctvBrandOptions.map((brand) => (
                <Link
                  key={brand}
                  href={buildCctvBookingHref(selectedService, brand)}
                  className="group relative block rounded-[20px] border border-gray-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(15,23,42,0.12)] sm:rounded-3xl sm:p-5"
                >
                  <div
                    className="absolute inset-0 rounded-3xl opacity-[0.03]"
                    style={{
                      backgroundImage: "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
                      backgroundSize: "20px 20px",
                    }}
                  />
                  <div className="relative z-10">
                    <div className="mb-5 flex items-start justify-between">
                      <div className="flex size-11 items-center justify-center rounded-2xl bg-sky-50">
                        <Camera className="size-5 text-[#0096FF]" />
                      </div>
                      <Check className="size-4 text-gray-300 transition-colors group-hover:text-[#00A878]" />
                    </div>
                    <h2 className="text-sm font-extrabold leading-tight text-gray-900 sm:text-base">{brand}</h2>
                    <p className="mt-2 text-[11px] leading-5 text-gray-500 sm:text-xs">Continue to booking</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
      <HomepageFooter />
    </div>
  );
}
