import type { Metadata } from "next";
import { ArrowUpRight, Building2, CheckCircle2, ShieldCheck, Sparkles, Users } from "lucide-react";

import { InfoPageLayout } from "@/src/components/next/InfoPageLayout";
import { companyName, supportEmail, supportPhoneDisplay } from "@/src/lib/company";
import { buildPageMetadata } from "@/src/lib/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "About Us",
  description: `Learn how ${companyName} delivers doorstep device repair, CCTV installation, and IT support in Bangalore with clear booking, fast confirmation, and reliable service.`,
  pathname: "/about-us",
});

const pillars = [
  {
    title: "Doorstep convenience",
    description: "We focus on making repair, CCTV installation, and IT support booking simple, responsive, and easy to access without unnecessary friction.",
    icon: Sparkles,
  },
  {
    title: "Reliable support",
    description: "We aim to communicate clearly, confirm orders promptly, and help customers through booking, updates, and service-related questions.",
    icon: Users,
  },
  {
    title: "Trust and accountability",
    description: "We structure our platform, policies, and customer communications to keep expectations clear for customers and the company.",
    icon: ShieldCheck,
  },
] as const;

export default function AboutUsPage() {
  return (
    <InfoPageLayout
      eyebrow="Our Story"
      title={`${companyName} is built for straightforward doorstep device care.`}
      description="We designed Looplic to make it easier for customers to discover supported devices, place service bookings, and reach support with confidence. Our goal is to keep the experience fast, clear, and dependable from first click to follow-up."
    >
      <section className="grid gap-4 md:grid-cols-3">
        {pillars.map((pillar) => (
          <article key={pillar.title} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <pillar.icon className="size-5" />
            </div>
            <h2 className="mt-4 text-lg font-semibold tracking-tight text-foreground">{pillar.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{pillar.description}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">What we do</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {[
            "Support customers in browsing device brands, series, and models.",
            "Enable booking flows for repair, CCTV installation, desktop assembly, IT support, and managed IT services.",
            "Provide contact channels for order assistance, support, and customer communication.",
            "Maintain policies covering privacy, platform use, service expectations, and customer responsibilities.",
          ].map((item) => (
            <div key={item} className="flex gap-3 rounded-xl border border-border/70 bg-background p-4">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
              <p className="text-sm leading-6 text-muted-foreground">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-primary/20 bg-[radial-gradient(circle_at_top_left,_hsl(211_100%_50%_/_0.14),_transparent_32%),radial-gradient(circle_at_85%_20%,_hsl(165_100%_42%_/_0.16),_transparent_28%),linear-gradient(135deg,_#ffffff,_#f8fafc)] shadow-sm">
        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_0.62fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.07] px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-primary">
              <Building2 className="size-3.5" />
              Product Studio
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">A product by Revenuxe</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              Looplic is built by Revenuxe with a focus on practical digital products, service workflows, and customer-first booking experiences. The same product thinking behind Looplic shapes how we design clear journeys for repair, installation, and support.
            </p>
            <a
              href="https://www.revenuxe.com"
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-black text-primary-foreground transition-opacity hover:opacity-90"
            >
              Visit Revenuxe
              <ArrowUpRight className="size-4" />
            </a>
          </div>
          <div className="rounded-2xl border border-white/80 bg-white/75 p-5 shadow-sm">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">Built For</div>
            <div className="mt-4 grid gap-3 text-sm font-semibold text-foreground">
              {["Service platforms", "Booking workflows", "Customer support journeys"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/80 p-3">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <CheckCircle2 className="size-4" />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">How we approach service quality</h2>
        <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground">
          <p>
            We aim to present our services, supported devices, and booking options as clearly as possible. Availability, timing, pricing, and service scope can vary by device, location, and operational conditions, so we may confirm final details during the booking or support process.
          </p>
          <p>
            Our platform is built to help customers move quickly, but we also care about clarity. That means we maintain dedicated policy pages, visible support contact details, and structured communication pathways so customers know where to go when they need help.
          </p>
          <p>
            For support, partnership questions, or service-related assistance, customers can contact us directly at <strong>{supportEmail}</strong> or <strong>{supportPhoneDisplay}</strong>.
          </p>
        </div>
      </section>
    </InfoPageLayout>
  );
}
