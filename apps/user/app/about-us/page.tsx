import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Award, Building2, CheckCircle2, Globe, HeartHandshake, Leaf, MapPin, ShieldCheck, Sparkles, Truck, Users, Zap } from "lucide-react";

import { InfoPageLayout } from "@/src/components/next/InfoPageLayout";
import { companyAddress, companyName, supportEmail, supportPhoneDisplay } from "@/src/lib/company";
import { buildPageMetadata } from "@/src/lib/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "About Looplic | India's Leading Device Recommerce & Doorstep Care Platform",
  description: `Discover how ${companyName} is revolutionizing smartphone buyback, certified refurbished electronics, and doorstep tech repairs in Bangalore and across India. Learn about our 32-point inspection standards, environmental sustainability mission, and founding story.`,
  pathname: "/about-us",
});

const corePillars = [
  {
    title: "Circular Recommerce",
    description: "Extending the operational lifecycle of premium consumer technology through certified refurbishing, reducing hazardous e-waste and raw mineral depletion.",
    icon: Leaf,
  },
  {
    title: "Guaranteed Fair Valuations",
    description: "Our automated pricing engine calculates transparent, fair market prices for used devices based on real-time market data, backed by instant doorstep UPI payouts.",
    icon: Zap,
  },
  {
    title: "Doorstep Precision Care",
    description: "Bringing certified repair engineers directly to your living room or office in 30 to 45 minutes with genuine parts and up to 6 months warranty.",
    icon: Truck,
  },
  {
    title: "Uncompromising Quality",
    description: "Every certified refurbished device undergoes an exhaustive 32-point diagnostic hardware and software test before leaving our central hub.",
    icon: ShieldCheck,
  },
] as const;

const milestones = [
  { metric: "47,200+", label: "Smartphones & Laptops Serviced" },
  { metric: "23,800+", label: "Delighted Repeat Customers" },
  { metric: "32-Point", label: "Diagnostic Certification Protocol" },
  { metric: "4.7 / 5.0", label: "Average Verified Customer Rating" },
];

const faqs = [
  {
    q: "Where is Looplic headquartered, and which cities do you currently operate in?",
    a: "Looplic is headquartered in the heart of Bengaluru, Karnataka at 1st Floor, Shawkat Building, SJP Road, near Town Hall (Pin: 560002). We provide on-demand doorstep technician visits and rapid courier delivery across all Bangalore zones (Koramangala, Indiranagar, HSR Layout, Whitefield, Electronic City, Jayanagar, etc.), alongside pan-India insured shipping for our certified refurbished catalog.",
  },
  {
    q: "How does Looplic ensure device quality for refurbished buyers?",
    a: "Every single phone, laptop, and tablet sold on Looplic is subjected to our proprietary 32-point diagnostic inspection conducted by certified hardware engineers. We verify display color fidelity, touch responsiveness, battery health (>85%), stereo microphones, cellular 5G bands, biometric scanners, and motherboard integrity. We never list devices that have uncertified aftermarket parts or liquid damage.",
  },
  {
    q: "How does the mobile buyback process work?",
    a: "You select your device brand and model on our Sell page, answer a few simple questions regarding physical and functional condition, and receive a guaranteed price quote. Our field technician arrives at your preferred doorstep time slot, conducts a quick 5-minute physical verification, and initiates an immediate instant payment directly to your bank account or UPI before taking custody of the phone.",
  },
  {
    q: "What warranty and replacement guarantees does Looplic provide?",
    a: "We back our refurbished devices with an industry-leading 7-day replacement guarantee and 6 to 12 months of comprehensive warranty coverage. For doorstep screen replacements and hardware repairs, we offer a dedicated 6-month warranty on touch performance and part reliability.",
  },
];

export default function AboutUsPage() {
  return (
    <InfoPageLayout
      eyebrow="Our Mission & Story"
      title={`${companyName} is redefining sustainable recommerce and on-demand tech care.`}
      description="Born out of Bangalore's vibrant technology hub, Looplic was founded to eliminate the friction, risks, and high costs of buying, selling, and repairing personal electronics. Here is how we build trust through technology, operational discipline, and customer-first care."
    >
      {/* Metrics Banner */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {milestones.map((m) => (
          <div key={m.label} className="rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-sm">
            <p className="text-2xl font-extrabold text-primary sm:text-3xl">{m.metric}</p>
            <p className="mt-1 text-xs font-medium text-gray-500">{m.label}</p>
          </div>
        ))}
      </section>

      {/* Core Pillars */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {corePillars.map((pillar) => {
          const Icon = pillar.icon;
          return (
            <article key={pillar.title} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </div>
              <h2 className="mt-4 text-base font-bold text-gray-900">{pillar.title}</h2>
              <p className="mt-2 text-xs leading-relaxed text-gray-600">{pillar.description}</p>
            </article>
          );
        })}
      </section>

      {/* Main Narrative & Philosophy */}
      <section className="space-y-8 rounded-2xl border border-gray-200 bg-white p-6 sm:p-10 shadow-sm text-gray-700 leading-relaxed">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">1. The Founding Vision of Looplic</h2>
          <p className="mt-3 text-sm">
            For decades, consumer electronics ownership in India has been plagued by a fundamental dilemma: buying a new flagship phone costs an arm and a leg, while selling an old phone or buying a used one requires dealing with shady local pawnshops, unresponsive classified listings, or high-risk strangers with zero warranties.
          </p>
          <p className="mt-3 text-sm">
            We started Looplic with a simple yet ambitious premise: <strong>What if upgrading, buying refurbished, or fixing personal technology was as reliable, seamless, and trustworthy as ordering a cab on your smartphone?</strong>
          </p>
          <p className="mt-3 text-sm">
            Headquartered in Bengaluru, Karnataka—India&apos;s technology capital—Looplic combines advanced algorithmic pricing, hyper-local logistics, and certified hardware laboratories to deliver an unmatched recommerce ecosystem. Whether you want to <Link href="/buy" className="font-semibold text-primary underline">Buy Refurbished Devices</Link>, <Link href="/sell" className="font-semibold text-primary underline">Sell an Old Phone</Link>, or request an <Link href="/apple-iphone-screen-replacement" className="font-semibold text-primary underline">iPhone Screen Replacement</Link> at your home, Looplic gives you complete peace of mind.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900">2. Our Four Verticals of Excellence</h2>
          <p className="mt-3 text-sm">
            Looplic is not just a marketplace; we are a full-stack technology operations platform structured around four interconnected divisions:
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                A. Certified Refurbished Device Marketplace
              </h3>
              <p className="mt-1.5 text-xs text-gray-600 leading-relaxed">
                We make flagship technology accessible. Our catalog features premium Apple iPhones, Samsung Galaxy flagships, OnePlus models, and MacBooks at up to 70% off retail pricing, backed by standard 6 to 12-month warranties, authentic chargers, and a 7-day return policy.
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Zap className="size-4 text-primary" />
                B. Instant Market-Rate Device Buyback
              </h3>
              <p className="mt-1.5 text-xs text-gray-600 leading-relaxed">
                Selling your old gadget takes less than 60 seconds on Looplic. Our transparent pricing calculates true residual values based on market demand and physical condition. When our technician verifies your device, you receive immediate cash or UPI payment on the spot.
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Truck className="size-4 text-primary" />
                C. On-Demand Doorstep Hardware Repair
              </h3>
              <p className="mt-1.5 text-xs text-gray-600 leading-relaxed">
                No more leaving your phone at an unverified repair booth for days. Our certified technicians arrive at your home or office with ESD-safe portable repair stations, replacing cracked screens, depleted batteries, and damaged charging ports in under 45 minutes right in front of your eyes.
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Building2 className="size-4 text-primary" />
                D. Enterprise IT &amp; CCTV Solutions
              </h3>
              <p className="mt-1.5 text-xs text-gray-600 leading-relaxed">
                Through our commercial division, we assist businesses and residential complexes across Bangalore with custom desktop assembly, commercial CCTV surveillance installations, enterprise Wi-Fi networking, and bulk IT asset disposition (ITAD).
              </p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900">3. Environmental Stewardship &amp; Circular Economy Impact</h2>
          <p className="mt-3 text-sm">
            Electronic waste is currently the fastest-growing solid waste stream on Earth. When a functional smartphone is discarded or left forgotten in a drawer, valuable rare-earth metals—including neodymium, dysprosium, gold, and lithium—are lost, while heavy metals like lead and mercury pose dangerous environmental hazards.
          </p>
          <p className="mt-2 text-sm">
            By choosing Looplic to refurbish, repair, or sell your device, you actively contribute to India&apos;s circular economy. Refurbishing a smartphone avoids over 80% of the greenhouse gas emissions associated with manufacturing a brand-new device from scratch.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900">4. Our Commitment to Data Privacy &amp; Security</h2>
          <p className="mt-3 text-sm">
            Customer data security is sacred at Looplic. Every device acquired through our buyback or trade-in programs undergoes a certified three-pass data sanitization protocol compliant with the National Institute of Standards and Technology (NIST SP 800-88 Rev. 1). All internal flash storage is completely and irrevocably wiped before diagnostic re-flashing, ensuring that no prior personal files, logins, or photos can ever be recovered.
          </p>
        </div>

        {/* Studio Box */}
        <div className="overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-blue-50/50 via-teal-50/30 to-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                <Building2 className="size-3.5" /> A Product Studio Initiative by Revenuxe
              </span>
              <h3 className="mt-3 text-xl font-bold text-gray-900">Engineered for Scale, Speed, and Reliability</h3>
              <p className="mt-2 text-xs sm:text-sm text-gray-600 max-w-2xl leading-relaxed">
                Looplic is engineered and operated by Revenuxe, a product studio dedicated to crafting digital infrastructure that transforms fragmented offline industries into streamlined, customer-obsessed on-demand services.
              </p>
            </div>
            <a
              href="https://www.revenuxe.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:opacity-90 transition-opacity shrink-0"
            >
              Visit Revenuxe <ArrowUpRight className="size-4" />
            </a>
          </div>
        </div>

        {/* FAQs */}
        <div className="pt-6 border-t border-gray-100">
          <h2 className="text-2xl font-extrabold text-gray-900">Frequently Asked Questions</h2>
          <div className="mt-4 space-y-3">
            {faqs.map((faq, idx) => (
              <div key={idx} className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
                <h4 className="font-bold text-sm text-gray-900">{faq.q}</h4>
                <p className="mt-1.5 text-xs sm:text-sm text-gray-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bangalore Hub Location Card */}
        <div className="rounded-xl bg-slate-900 text-white p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">Bengaluru Flagship Experience Center</span>
            <h4 className="text-base font-bold text-white">{companyAddress}</h4>
            <p className="text-xs text-slate-400">
              Helpline: {supportPhoneDisplay} • Email: {supportEmail}
            </p>
          </div>
          <Link
            href="/store-locator"
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-xs font-bold text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
          >
            View on Google Maps <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {/* Internal Linking Directory */}
        <div className="pt-4 border-t border-gray-100">
          <h3 className="text-base font-bold text-gray-900 mb-3">Quick Navigation &amp; Ecosystem Links</h3>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 text-xs text-gray-600">
            <div className="space-y-1">
              <p className="font-bold text-gray-800">Buy Refurbished</p>
              <ul className="space-y-1">
                <li><Link href="/buy" className="hover:text-primary">• All Refurbished Devices</Link></li>
                <li><Link href="/buy?category=phone" className="hover:text-primary">• Refurbished Mobile Phones</Link></li>
                <li><Link href="/buy?category=laptop" className="hover:text-primary">• Refurbished Laptops</Link></li>
                <li><Link href="/refund-policy" className="hover:text-primary">• 7-Day Refund Policy</Link></li>
              </ul>
            </div>
            <div className="space-y-1">
              <p className="font-bold text-gray-800">Sell Old Devices</p>
              <ul className="space-y-1">
                <li><Link href="/sell" className="hover:text-primary">• Sell Old Smartphone</Link></li>
                <li><Link href="/sell/laptop" className="hover:text-primary">• Sell Used Laptop</Link></li>
                <li><Link href="/sell/tablet" className="hover:text-primary">• Sell Old iPad/Tablet</Link></li>
                <li><Link href="/sell/smartwatch" className="hover:text-primary">• Sell Smartwatch</Link></li>
              </ul>
            </div>
            <div className="space-y-1">
              <p className="font-bold text-gray-800">Doorstep Repairs</p>
              <ul className="space-y-1">
                <li><Link href="/apple-iphone-screen-replacement" className="hover:text-primary">• iPhone Screen Repair</Link></li>
                <li><Link href="/samsung-screen-replacement" className="hover:text-primary">• Samsung Screen Repair</Link></li>
                <li><Link href="/service/mobile-repair" className="hover:text-primary">• All Mobile Repairs</Link></li>
                <li><Link href="/service/laptop-repair" className="hover:text-primary">• Laptop Hardware Repair</Link></li>
              </ul>
            </div>
            <div className="space-y-1">
              <p className="font-bold text-gray-800">Bangalore &amp; Company</p>
              <ul className="space-y-1">
                <li><Link href="/bangalore" className="hover:text-primary">• Bangalore Service Zones</Link></li>
                <li><Link href="/careers" className="hover:text-primary">• Join Our Team (Careers)</Link></li>
                <li><Link href="/contact-us" className="hover:text-primary">• Contact Bangalore Desk</Link></li>
                <li><Link href="/terms-and-conditions" className="hover:text-primary">• Terms &amp; Conditions</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </InfoPageLayout>
  );
}
