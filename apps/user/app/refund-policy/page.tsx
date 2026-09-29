import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, HelpCircle, RefreshCcw, ShieldCheck, Truck } from "lucide-react";

import { InfoPageLayout } from "@/src/components/next/InfoPageLayout";
import { companyAddress, companyName, supportEmail, supportPhoneDisplay } from "@/src/lib/company";
import { buildPageMetadata } from "@/src/lib/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Return, Replacement and Refund Policy | Looplic Refurbished Devices & Services",
  description: `Complete guide to ${companyName}'s 7-Day Replacement Guarantee, 6 to 12-Month Comprehensive Warranty, and Hassle-Free Refund Policy for certified refurbished smartphones, tablets, laptops, and doorstep repair services across Bangalore and India.`,
  pathname: "/refund-policy",
});

const policyPillars = [
  {
    icon: RefreshCcw,
    title: "7-Day Replacement Guarantee",
    description:
      "Every certified refurbished smartphone, laptop, and tablet purchased on Looplic comes with a zero-questions-asked 7-day replacement window in case of technical defects or discrepancies.",
  },
  {
    icon: ShieldCheck,
    title: "6 to 12-Month Warranty",
    description:
      "All devices pass our rigorous 32-point hardware and software diagnostic inspection, backed by up to 12 months of comprehensive warranty covering motherboard, screen, and battery issues.",
  },
  {
    icon: Clock,
    title: "Instant Refund Processing",
    description:
      "Once an authorized return is received and verified at our inspection hub, refunds are credited back to your original payment method or bank account within 24 to 48 business hours.",
  },
  {
    icon: Truck,
    title: "Free Return Doorstep Pickup",
    description:
      "You don't have to visit a courier hub or pay for shipping. Our logistics partner will schedule a doorstep reverse pickup from your home or office address at zero extra cost.",
  },
];

const faqs = [
  {
    q: "How do I request a return or replacement for a refurbished phone?",
    a: "You can initiate a return or replacement within 7 calendar days of delivery by visiting your Account dashboard, going to Order History, selecting the item, and clicking 'Request Replacement / Return'. Alternatively, you can email our customer care at support@looplic.com or message our dedicated WhatsApp helpline with your order ID.",
  },
  {
    q: "What conditions must be met for a valid device return?",
    a: "The refurbished device must be returned in the original packaging provided by Looplic, along with the included charging cable, accessories, warranty card, and invoice. The device must be cleared of all personal accounts (Apple iCloud, Google Account, Samsung Account), screen locks, and biometric passcodes before dispatch.",
  },
  {
    q: "What is the warranty policy for doorstep repair services?",
    a: "Doorstep screen replacements and hardware repairs performed by Looplic certified technicians come with an exclusive 6-month warranty. If the replaced component exhibits touch latency, dead pixels, or functional faults not caused by accidental liquid or physical drop damage, our technician will replace it free of charge.",
  },
  {
    q: "How does the buyback price payout work when selling an old phone?",
    a: "When you sell your old smartphone, laptop, or tablet on Looplic, our technician inspects the device at your doorstep, confirms the physical and functional parameters, and initiates an immediate instant payment directly to your verified UPI ID or bank account before taking handover.",
  },
  {
    q: "Are software glitches and battery degradations covered under refurbished warranty?",
    a: "Yes. Looplic refurbished devices are certified to maintain at least 85%+ battery health. If your battery drops below normal thresholds or develops unexpected power drain or internal component failures during the warranty period, Looplic will repair or replace the battery free of cost under our standard warranty policy.",
  },
];

export default function RefundPolicyPage() {
  return (
    <InfoPageLayout
      eyebrow="Trust & Transparency"
      title="Return, Replacement & Refund Policy"
      description="At Looplic, customer confidence and product reliability are at the core of our recommerce mission. Here is our comprehensive, transparent return, refund, and warranty framework for all devices and doorstep services."
    >
      {/* Pillars */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {policyPillars.map((p) => {
          const Icon = p.icon;
          return (
            <div key={p.title} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </div>
              <h3 className="mt-3 text-base font-bold text-gray-900">{p.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-gray-600">{p.description}</p>
            </div>
          );
        })}
      </section>

      {/* In-depth semantic text section */}
      <section className="space-y-8 rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm text-gray-700 leading-relaxed">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">1. Overview of Looplic Return & Refund Terms</h2>
          <p className="mt-3 text-sm">
            Looplic operates India&apos;s trusted device recommerce and certified refurbished electronics ecosystem. Whether you are buying a refurbished iPhone 14, selling an old Samsung Galaxy smartphone, or booking a doorstep screen replacement in Bangalore, our objective is to deliver unmatched reliability, complete fairness, and transparent operations.
          </p>
          <p className="mt-3 text-sm">
            This Return, Replacement, and Refund Policy applies to all orders placed on the Looplic platform (<Link href="/" className="font-semibold text-primary underline">www.looplic.com</Link>), including refurbished mobile phones, laptops, smart accessories, and scheduled on-site maintenance services.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900">2. Seven-Day Replacement Policy for Refurbished Devices</h2>
          <p className="mt-3 text-sm">
            Every device sold on our <Link href="/buy" className="font-semibold text-primary underline">Buy Refurbished Devices</Link> marketplace undergoes a rigorous 32-point inspection by certified engineers. In the rare event that your delivered product exhibits any functional or technical issue, you are eligible for an immediate replacement within 7 calendar days of receipt.
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
            <li><strong>Eligible scenarios:</strong> Hardware failure, non-functional touchscreen, camera malfunction, biometric sensor failure, mic/speaker defect, or cosmetic grade discrepancy compared to the purchased condition (Superb, Very Good, Fair).</li>
            <li><strong>Ineligible scenarios:</strong> Accidental physical impact or cracks occurring after delivery, liquid submersion, unauthorized third-party tampering, or failure to remove cloud locks before reverse transit.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900">3. Comprehensive Warranty Terms (6 to 12 Months)</h2>
          <p className="mt-3 text-sm">
            Looplic provides a standard warranty on all certified pre-owned devices starting from the date of customer delivery. The specific duration (6 or 12 months) is clearly marked on your digital invoice and product certificate.
          </p>
          <p className="mt-2 text-sm">
            During the warranty tenure, if your smartphone or laptop develops internal motherboard faults, charging port failures, spontaneous display artifacts, or battery health deterioration below 80%, Looplic provides free repairs or equivalent device replacements.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900">4. Doorstep Device Repair & Screen Replacement Warranty</h2>
          <p className="mt-3 text-sm">
            Customers booking doorstep repair through our <Link href="/service/mobile-repair" className="font-semibold text-primary underline">Phone Repair Services</Link> or dedicated brand replacement portals (including <Link href="/apple-iphone-screen-replacement" className="font-semibold text-primary underline">iPhone Screen Replacement</Link> and <Link href="/samsung-screen-replacement" className="font-semibold text-primary underline">Samsung Screen Replacement</Link>) receive up to 6 months of screen touch warranty.
          </p>
          <p className="mt-2 text-sm">
            If the replaced touch digitizer exhibits unresponsive regions or ghost touch anomalies, our technician will visit your location to replace the part at zero diagnostic or labor fee.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900">5. Refund Timelines and Payout Methods</h2>
          <p className="mt-3 text-sm">
            When a replacement unit is unavailable in our inventory or a refund request has been officially approved:
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-gray-50 text-gray-800 font-bold border-b">
                <tr>
                  <th className="py-2.5 px-4">Payment Method</th>
                  <th className="py-2.5 px-4">Refund Mode</th>
                  <th className="py-2.5 px-4">Processing Timeline</th>
                </tr>
              </thead>
              <tbody className="divide-y text-gray-600">
                <tr>
                  <td className="py-2.5 px-4 font-medium">UPI / GPay / PhonePe / Paytm</td>
                  <td className="py-2.5 px-4">Direct UPI VPA Credit</td>
                  <td className="py-2.5 px-4 text-emerald-600 font-semibold">Instant to 4 Hours</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium">Credit / Debit Card</td>
                  <td className="py-2.5 px-4">Original Card Gateway Refund</td>
                  <td className="py-2.5 px-4">3 to 5 Business Days</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium">Net Banking (IMPS/NEFT)</td>
                  <td className="py-2.5 px-4">Direct Bank Account Transfer</td>
                  <td className="py-2.5 px-4">24 to 48 Business Hours</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium">Cash on Delivery (COD)</td>
                  <td className="py-2.5 px-4">Verified Bank Account / UPI</td>
                  <td className="py-2.5 px-4">24 to 48 Hours upon QC</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900">6. Device Buyback Payout Terms</h2>
          <p className="mt-3 text-sm">
            When you sell your old gadgets via our <Link href="/sell" className="font-semibold text-primary underline">Sell Old Mobile Phone</Link> platform, price quotations are calculated dynamically based on physical body condition, functional checks, screen original status, and warranty age.
          </p>
          <p className="mt-2 text-sm">
            Once you accept the on-site physical evaluation quote, payment is executed immediately via instant IMPS or UPI transfer before our executive leaves your premises. Once payout is accepted and biometric/personal clearance is signed, the buyback transaction is finalized and non-reversible.
          </p>
        </div>

        {/* FAQs */}
        <div className="pt-6 border-t border-gray-100">
          <h2 className="text-2xl font-extrabold text-gray-900">Frequently Asked Questions</h2>
          <div className="mt-5 space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
                <h3 className="font-bold text-gray-900 text-sm flex items-start gap-2">
                  <HelpCircle className="size-4 text-primary shrink-0 mt-0.5" />
                  {faq.q}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-gray-600 pl-6 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact CTA */}
        <div className="rounded-xl bg-gradient-to-r from-blue-50 to-teal-50 p-6 border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-gray-900 text-base">Have questions about your order or warranty?</h3>
            <p className="mt-1 text-xs text-gray-600">
              Our Bangalore support desk is available Monday to Saturday, 9:30 AM to 8:00 PM IST.
            </p>
          </div>
          <Link
            href="/contact-us"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90 transition-opacity"
          >
            Contact Customer Support <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </section>
    </InfoPageLayout>
  );
}
