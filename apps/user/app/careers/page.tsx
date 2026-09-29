import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Briefcase, CheckCircle2, HeartHandshake, Laptop, MapPin, Rocket, ShieldCheck, Sparkles, Users } from "lucide-react";

import { InfoPageLayout } from "@/src/components/next/InfoPageLayout";
import { companyAddress, companyName, supportEmail } from "@/src/lib/company";
import { buildPageMetadata } from "@/src/lib/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Careers & Open Positions | Join the Looplic Team",
  description: `Join ${companyName} in building India's fastest growing circular recommerce and electronics repair platform. Explore career opportunities in software engineering, operations, device diagnostics, quality assurance, and customer care in Bangalore.`,
  pathname: "/careers",
});

const values = [
  {
    icon: Rocket,
    title: "Mission-Driven Circular Economy",
    description:
      "We believe that extending the lifecycle of smartphones, laptops, and consumer electronics is crucial for reducing electronic waste and promoting environmental sustainability.",
  },
  {
    icon: Users,
    title: "Customer-Obsessed Excellence",
    description:
      "From seamless 10-second online device valuations to doorstep technician visits and certified refurbished quality checks, customer trust guides every decision we make.",
  },
  {
    icon: Laptop,
    title: "Modern Tech Stack & Fast Execution",
    description:
      "We build on high-velocity modern architectures: Next.js, TypeScript, PostgreSQL, microservices, and AI-assisted pricing algorithms to solve real-world logistical challenges.",
  },
  {
    icon: HeartHandshake,
    title: "Empowerment & Continuous Growth",
    description:
      "We foster an inclusive culture with competitive compensations, performance bonuses, health coverage, and continuous learning opportunities across tech and operations.",
  },
];

const openPositions = [
  {
    title: "Senior Full Stack Engineer (Next.js / Node.js)",
    department: "Engineering",
    location: "Bangalore (Hybrid)",
    type: "Full Time",
    experience: "3 - 6 Years",
    description:
      "Lead core frontend and backend workflows across our customer ecommerce portal, automated buyback engine, and real-time technician dispatch applications.",
  },
  {
    title: "Lead Hardware Diagnostic & QC Engineer",
    department: "Quality Assurance",
    location: "Bangalore (Central Hub)",
    type: "Full Time",
    experience: "2 - 5 Years",
    description:
      "Oversee the 32-point inspection certification protocol for refurbished iPhones, Samsung Galaxy flagships, and premium laptops, ensuring factory-grade grading and reliability.",
  },
  {
    title: "Doorstep Field Service Technicians (Smartphones & Laptops)",
    department: "Field Operations",
    location: "Bangalore (Multiple Hubs)",
    type: "Full Time",
    experience: "1 - 4 Years",
    description:
      "Execute on-site diagnostic inspections, screen replacements, and battery installations across Bangalore. Two-wheeler and smartphone repair experience required.",
  },
  {
    title: "Operations & Supply Chain Coordinator",
    department: "Operations",
    location: "Bangalore (Central Hub)",
    type: "Full Time",
    experience: "2 - 4 Years",
    description:
      "Manage reverse logistics, technician scheduling, inventory fulfillment, and buyback device processing across our vendor networks.",
  },
  {
    title: "Customer Success & Escalation Specialist",
    department: "Support",
    location: "Bangalore (On-site)",
    type: "Full Time",
    experience: "1 - 3 Years",
    description:
      "Deliver proactive customer communication across voice, email, and WhatsApp channels, resolving warranty inquiries, order tracking, and technician coordination.",
  },
];

const hiringSteps = [
  { step: "01", title: "Application Review", desc: "Our talent team evaluates your portfolio, experience, and alignment with our mission." },
  { step: "02", title: "Technical / Domain Deep Dive", desc: "A practical conversation focused on problem solving, architecture, or diagnostic skills." },
  { step: "03", title: "Culture & Team Fit", desc: "Meet the founders and cross-functional team leaders to explore our shared vision." },
  { step: "04", title: "Offer & Onboarding", desc: "Receive a competitive offer and kickstart your onboarding journey with complete equipment support." },
];

export default function CareersPage() {
  return (
    <InfoPageLayout
      eyebrow="Join Our Journey"
      title="Build the Future of Sustainable Electronics Recommerce"
      description="Looplic is redefining how millions of people buy, sell, and repair personal technology. If you are passionate about high-impact engineering, operational craftsmanship, and circular economy, join our Bangalore team today."
    >
      {/* Values Grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {values.map((v) => {
          const Icon = v.icon;
          return (
            <div key={v.title} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </div>
              <h3 className="mt-3 text-base font-bold text-gray-900">{v.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-gray-600">{v.description}</p>
            </div>
          );
        })}
      </section>

      {/* Culture & In-depth Story */}
      <section className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm text-gray-700 leading-relaxed">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">Life at Looplic</h2>
          <p className="mt-3 text-sm">
            At Looplic, we operate at the intersection of consumer technology, sustainable recommerce, and on-demand field logistics. Every month, thousands of smartphones and laptops pass through our platform—either finding new owners as certified refurbished devices on <Link href="/buy" className="font-semibold text-primary underline">Buy Refurbished Devices</Link>, or being revitalized through our <Link href="/service/mobile-repair" className="font-semibold text-primary underline">Doorstep Repair Services</Link>.
          </p>
          <p className="mt-2 text-sm">
            We are proud to be headquartered in Bengaluru, Karnataka, surrounded by India&apos;s most dynamic technology ecosystem. Our team includes software architects, field engineers, supply chain specialists, and customer champions working together under a unified goal: making premium technology accessible, affordable, and sustainable.
          </p>
        </div>

        {/* Open Positions List */}
        <div className="pt-4 border-t border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900">Current Openings</h2>
              <p className="mt-1 text-xs text-gray-500">Explore open roles across tech, operations, and customer care.</p>
            </div>
            <a
              href={`mailto:${supportEmail}?subject=General%20Career%20Application%20-%20Looplic`}
              className="text-xs font-bold text-primary hover:underline"
            >
              Don&apos;t see your role? Send an open application &rarr;
            </a>
          </div>

          <div className="space-y-4">
            {openPositions.map((job) => (
              <div
                key={job.title}
                className="group rounded-xl border border-gray-200 bg-gray-50/50 p-5 transition-all hover:border-primary/50 hover:bg-white hover:shadow-md"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 group-hover:text-primary transition-colors">
                      {job.title}
                    </h3>
                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1 font-medium text-gray-700">
                        <Briefcase className="size-3.5 text-primary" /> {job.department}
                      </span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3.5 text-gray-400" /> {job.location}
                      </span>
                      <span>•</span>
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-700">
                        {job.type}
                      </span>
                      <span>•</span>
                      <span className="text-gray-500 font-medium">Exp: {job.experience}</span>
                    </div>
                  </div>
                  <a
                    href={`mailto:${supportEmail}?subject=Application%20for%20${encodeURIComponent(job.title)}`}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90 transition-opacity self-start sm:self-auto"
                  >
                    Apply Now <ArrowRight className="size-3.5" />
                  </a>
                </div>
                <p className="mt-3 text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                  {job.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Hiring Process */}
        <div className="pt-6 border-t border-gray-100">
          <h2 className="text-2xl font-extrabold text-gray-900">Our Hiring Process</h2>
          <p className="mt-1 text-xs text-gray-500">
            We value your time. Our interview process is transparent, structured, and typically completes within 7 to 10 days.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {hiringSteps.map((st) => (
              <div key={st.step} className="rounded-xl border border-gray-100 bg-gray-50/80 p-4">
                <span className="text-xl font-extrabold text-primary">{st.step}</span>
                <h4 className="mt-2 text-sm font-bold text-gray-900">{st.title}</h4>
                <p className="mt-1 text-xs text-gray-600 leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Office & Contact Box */}
        <div className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-base text-white">Central Hub & Headquarters</h3>
            <p className="mt-1 text-xs text-slate-300">
              {companyAddress}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              For campus partnerships, recruitment queries, and vendor onboarding:{" "}
              <a href={`mailto:${supportEmail}`} className="text-teal-400 underline">{supportEmail}</a>
            </p>
          </div>
          <Link
            href="/about-us"
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-xs font-bold text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
          >
            Learn More About Looplic <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </section>
    </InfoPageLayout>
  );
}
