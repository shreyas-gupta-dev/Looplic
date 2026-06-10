import type { Metadata } from "next";
import Link from "next/link";

import { InfoPageLayout } from "@/src/components/next/InfoPageLayout";
import { companyName, supportEmail, supportPhoneDisplay } from "@/src/lib/company";
import { buildPageMetadata } from "@/src/lib/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Terms and Conditions",
  description: `Read the ${companyName} Terms and Conditions for platform use, bookings, cancellations, customer responsibilities, liability limits, and service policies.`,
  pathname: "/terms-and-conditions",
});

const sections = [
  {
    title: "1. Acceptance of terms",
    body: [
      "These Terms and Conditions govern your access to and use of the Looplic website, accounts, booking flows, support channels, and related services. By accessing or using the platform, you agree to be bound by these terms.",
      "If you do not agree with these terms, you should not use the platform or place bookings through it.",
    ],
  },
  {
    title: "2. Service scope",
    body: [
      "Looplic provides a platform for browsing supported device categories, placing bookings, and connecting customers with available repair-related service workflows. Service availability may vary by device, inventory, location, timing, operational constraints, and internal review.",
      "We reserve the right to modify, suspend, refuse, limit, or discontinue any feature, route, listing, service category, or booking option at any time without liability where reasonably necessary for business, operational, or legal reasons.",
    ],
  },
  {
    title: "3. Account and booking information",
    body: [
      "You agree to provide accurate, current, and complete information while creating an account, making a booking, or contacting support. You are responsible for the accuracy of your device details, address, contact number, and all other information submitted through the platform.",
      "We may cancel, reject, or hold a booking where information appears incomplete, misleading, fraudulent, technically inconsistent, or operationally unserviceable.",
    ],
  },
  {
    title: "4. Pricing, availability, and confirmation",
    body: [
      "Displayed prices, listings, categories, and service options are subject to change without prior notice. A displayed price or service listing does not guarantee final availability, acceptance, or execution until confirmed by us.",
      "We reserve the right to correct pricing errors, listing inaccuracies, technical issues, or catalog mistakes, including after a booking request is submitted.",
    ],
  },
  {
    title: "5. Scheduling and cancellations",
    body: [
      "Requested time slots and dates are indicative unless expressly confirmed. Actual service timing may depend on technician availability, geography, device scope, traffic, inventory, customer responsiveness, and operational conditions.",
      "We may reschedule, delay, or cancel appointments where required for safety, logistics, service feasibility, force majeure, compliance, or circumstances beyond our reasonable control.",
      "Customers should review booking details carefully. Cancellation rights may be limited once an order progresses beyond the pending stage or once operational costs have already been committed.",
    ],
  },
  {
    title: "6. Customer responsibilities",
    body: [
      "Customers must ensure safe and reasonable access for service performance, provide correct device details, cooperate with verification requests, and avoid misuse of the platform or support channels.",
      "You agree not to use the platform for fraudulent activity, abusive conduct, unlawful content, unauthorized access, or any use that could disrupt operations, damage systems, or harm the company, its personnel, or other users.",
    ],
  },
  {
    title: "7. Warranty, disclaimer, and limitations",
    body: [
      "To the fullest extent permitted by law, the platform and its content are provided on an as-available and as-is basis. We do not guarantee uninterrupted availability, error-free operation, or that every listing, category, or technical detail will always be complete or current.",
      "Except where non-excludable obligations apply, Looplic disclaims implied warranties relating to merchantability, fitness for a particular purpose, uninterrupted access, and non-infringement.",
      "To the maximum extent permitted by law, Looplic shall not be liable for indirect, incidental, special, consequential, punitive, or business-interruption losses, including lost profits, lost opportunities, data loss, service delays, or third-party conduct.",
      "Our aggregate liability relating to platform use or bookings shall be limited to the amount actually paid by you to Looplic for the specific booking directly giving rise to the claim, except where a different standard is required by applicable law.",
    ],
  },
  {
    title: "8. Intellectual property",
    body: [
      "All platform content, branding, text, design, structure, software logic, and visual materials made available by Looplic are owned by us or used under appropriate rights. You may not reproduce, copy, scrape, republish, or commercially exploit platform content without permission.",
    ],
  },
  {
    title: "9. Termination and enforcement",
    body: [
      "We may suspend or terminate access, remove content, restrict bookings, or refuse support where we reasonably believe that these terms, our policies, applicable law, or platform integrity have been violated.",
      "We reserve all rights and remedies available under contract, equity, and applicable law.",
    ],
  },
  {
    title: "10. Governing updates",
    body: [
      "We may update these Terms and Conditions from time to time to reflect business, legal, technical, or operational changes. Continued use of the platform after updated terms are posted indicates acceptance of the revised version.",
    ],
  },
] as const;

const customerTerms = [
  {
    title: "No direct dealing outside Looplic",
    body:
      "If a customer directly deals with, pays, hires, or repairs through a technician outside the Looplic booking, billing, support, or approval flow, Looplic will not be responsible for any issue, service failure, warranty claim, guarantee claim, spare part concern, data concern, damage, delay, payment dispute, safety concern, or follow-up support connected to that off-platform transaction.",
  },
  {
    title: "Report direct technician pitching",
    body:
      "If a technician asks a customer to cancel a Looplic order, offers a lower amount outside Looplic, requests direct payment, or attempts to move the repair outside the platform, the customer should immediately share valid proof with Looplic. After verification, the customer may be eligible for a full free-of-cost service for that reported order, subject to Looplic review and approval.",
  },
  {
    title: "Booking and payment integrity",
    body:
      "Customers should keep all booking, payment, quotation, invoice, warranty, and support communication within Looplic-approved channels. Customers should not share OTPs, account passwords, private financial details, or unnecessary personal information with any technician.",
  },
  {
    title: "Visiting charge and waiver",
    body:
      "Looplic may apply a visiting charge of Rs. 499 for mobile phone service visits, Rs. 1199 for laptop service visits, and Rs. 1199 for CCTV service visits. The visiting charge is waived once the customer claims the service from Looplic. If the customer does not claim the service after the visit, the customer has to pay the applicable visiting charge.",
  },
  {
    title: "Safe doorstep environment",
    body:
      "Customers must provide a safe, lawful, and reasonable service environment. The service area should have adequate light, access, permission, and supervision where needed. Customers should keep children, restricted areas, valuables, and sensitive documents away from the service work zone.",
  },
  {
    title: "Device data and inspection",
    body:
      "Customers are responsible for backing up important data where possible, removing sensitive access where practical, and disclosing prior damage, liquid exposure, repair history, or symptoms honestly before inspection or repair begins.",
  },
];

const technicianTerms = [
  {
    title: "No direct dealing with Looplic customers",
    body:
      "Technicians must not directly deal with any customer introduced through Looplic for any repair, installation, pickup, inspection, spare part, quote, warranty, repeat service, or follow-up work outside Looplic. Technicians must not pitch a lower price, ask the customer to cancel the Looplic order, request direct payment, share personal repair offers, or move the customer away from Looplic channels.",
  },
  {
    title: "Penalty for direct pitching with proof",
    body:
      "If a Looplic customer shares valid proof that a technician pitched direct service, requested off-platform payment, or asked the customer to cancel or bypass Looplic, Looplic may offer the customer full free-of-cost service for the reported order. The technician will receive a red flag and must bear the full free service cost, including spare parts, consumables, visit cost, and any related service expense as determined by Looplic.",
  },
  {
    title: "Attire, identity, and arrival",
    body:
      "Technicians must arrive in clean, professional attire suitable for doorstep service. Where Looplic provides identification, uniform, badge, order reference, or verification instruction, the technician must carry and present it. Technicians must arrive on time, inform operations about delays, and review the order before reaching the customer location.",
  },
  {
    title: "Professional behaviour",
    body:
      "Technicians must be polite, calm, respectful, and non-discriminatory. Harassment, abusive language, intimidation, aggressive selling, inappropriate comments, smoking, intoxication, unnecessary personal questions, or arguments at the customer location are strictly prohibited.",
  },
  {
    title: "Doorstep safety and property respect",
    body:
      "Technicians must enter only the area required for service, avoid touching unrelated property, avoid taking photos or recordings without permission, keep tools organized, and protect the customer's device, premises, accessories, data, and privacy. Any damage, accident, dispute, unsafe condition, or customer concern must be reported to Looplic immediately.",
  },
  {
    title: "Repair scope and quotation discipline",
    body:
      "Technicians must follow the assigned order scope, inspection flow, quotation rules, warranty instructions, and spare part approval process. No extra work, extra charge, replacement, pickup, or return commitment should be made without Looplic approval and customer consent through approved channels.",
  },
  {
    title: "Data privacy and device handling",
    body:
      "Technicians must not access customer photos, messages, apps, files, accounts, or personal data except where strictly required for testing and with customer permission. Technicians must not copy, transfer, disclose, photograph, or misuse customer data.",
  },
  {
    title: "Corrective action",
    body:
      "Violation of technician terms may lead to red flagging, payout hold, cost recovery, temporary suspension, permanent removal, legal action, and recovery of losses, including customer compensation, spare cost, logistics cost, and platform damage where applicable.",
  },
];

function TermsList({ items }: { items: readonly { title: string; body: string }[] }) {
  return (
    <div className="mt-4 grid gap-3">
      {items.map((item, index) => (
        <div key={item.title} className="rounded-xl border border-border/70 bg-background p-4">
          <h3 className="text-sm font-black text-foreground">
            {index + 1}. {item.title}
          </h3>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.body}</p>
        </div>
      ))}
    </div>
  );
}

export default function TermsPage() {
  return (
    <InfoPageLayout
      eyebrow="Legal"
      title="Terms and Conditions"
      description={`These Terms and Conditions are intended to set clear expectations between ${companyName} and users of the platform, while protecting operational integrity, customer clarity, and the company’s legal position.`}
    >
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm leading-7 text-muted-foreground">
          By accessing or using the Looplic website, creating an account, placing an order, or contacting us through platform channels, you agree to these Terms and Conditions and our Privacy Policy.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="#customer-terms" className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-bold text-foreground transition-colors hover:border-primary/30 hover:text-primary">
            Customer terms
          </Link>
          <Link href="#technician-terms" className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-bold text-foreground transition-colors hover:border-primary/30 hover:text-primary">
            Technician terms
          </Link>
        </div>
      </section>

      <section id="customer-terms" className="scroll-mt-24 rounded-2xl border border-primary/20 bg-primary/[0.04] p-6 shadow-sm">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Customer service terms</h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          These customer terms apply to bookings, doorstep visits, repairs, support, payments, warranties, and customer-technician interaction connected to Looplic.
        </p>
        <TermsList items={customerTerms} />
      </section>

      <section id="technician-terms" className="scroll-mt-24 rounded-2xl border border-primary/20 bg-primary/[0.04] p-6 shadow-sm">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Technician conduct terms</h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          These technician terms apply to technician applications, approved technician access, assigned orders, doorstep visits, pickup, inspection, quotes, repair work, billing, and customer communication through Looplic.
        </p>
        <TermsList items={technicianTerms} />
      </section>

      {sections.map((section) => (
        <section key={section.title} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">{section.title}</h2>
          <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground">
            {section.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>
      ))}

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Questions about these terms</h2>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          Questions regarding these Terms and Conditions can be directed to <strong>{supportEmail}</strong> or <strong>{supportPhoneDisplay}</strong>.
        </p>
      </section>
    </InfoPageLayout>
  );
}
