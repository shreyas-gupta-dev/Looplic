import type { Metadata } from "next";

import { InfoPageLayout } from "@/src/components/next/InfoPageLayout";
import { companyName, supportEmail, supportPhoneDisplay } from "@/src/lib/company";
import { buildPageMetadata } from "@/src/lib/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Privacy Policy",
  description: `Read the ${companyName} Privacy Policy covering personal information, bookings, support communication, security, and customer privacy rights.`,
  pathname: "/privacy-policy",
});

const sections = [
  {
    title: "1. Information we collect",
    body: [
      "We may collect personal information you provide directly, including your name, phone number, email address, service address, city, pincode, booking details, device information, and any information you choose to share while using our platform or contacting support.",
      "We may also collect account, booking, and service-related data generated through your use of the website, including order history, communication preferences, status updates, and support interactions.",
    ],
  },
  {
    title: "2. How we use your information",
    body: [
      "We use personal information to create and manage accounts, process bookings, coordinate services, communicate about orders, provide customer support, improve our platform, prevent misuse, and comply with legal or operational obligations.",
      "We may use your contact details to confirm bookings, share service updates, respond to enquiries, address disputes, and maintain records related to customer support and service quality.",
    ],
  },
  {
    title: "3. Sharing and disclosure",
    body: [
      "We may share information with service providers, contractors, support tools, hosting providers, payment-related tools, analytics providers, or operational partners where reasonably necessary to operate the platform and fulfill customer requests.",
      "We may also disclose information where required to comply with law, enforce our policies, protect our legal rights, investigate fraud or abuse, or respond to lawful requests from authorities.",
    ],
  },
  {
    title: "4. Data retention",
    body: [
      "We retain information for as long as reasonably necessary for account management, bookings, service records, support handling, compliance, dispute resolution, operational continuity, and legitimate business needs.",
      "Retention periods may vary depending on the nature of the information, service history, legal obligations, and the need to maintain internal records for safety, fraud prevention, or support quality.",
    ],
  },
  {
    title: "5. Security",
    body: [
      "We take commercially reasonable steps to protect data against unauthorized access, misuse, alteration, or disclosure. However, no digital platform or transmission method can be guaranteed to be fully secure.",
      "You are responsible for maintaining the confidentiality of your account credentials and for notifying us promptly if you suspect unauthorized access or misuse.",
    ],
  },
  {
    title: "6. Your choices",
    body: [
      "You may contact us to request updates to your account or profile information, or to raise privacy-related questions. In some cases, we may need to retain certain information for legal, security, recordkeeping, or operational reasons even after a request is made.",
      "Where applicable, you may also request information about the data associated with your account, subject to identity verification and any lawful limitations.",
    ],
  },
  {
    title: "7. Third-party services and links",
    body: [
      "Our platform may integrate with or link to third-party services, tools, or websites. We are not responsible for the privacy practices, content, or controls of third-party services that are not owned or operated by us.",
      "Customers should review the privacy practices of third-party providers separately before sharing information through those services.",
    ],
  },
  {
    title: "8. Policy updates",
    body: [
      "We may update this Privacy Policy from time to time to reflect changes in our services, legal requirements, business operations, or platform features. Updated versions become effective when posted unless stated otherwise.",
    ],
  },
] as const;

export default function PrivacyPolicyPage() {
  return (
    <InfoPageLayout
      eyebrow="Privacy"
      title="Privacy Policy"
      description={`This Privacy Policy explains how ${companyName} collects, uses, stores, and shares information when customers access our platform, create accounts, place bookings, or contact support.`}
    >
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm leading-7 text-muted-foreground">
          By using the Looplic platform, you acknowledge that your information may be processed in accordance with this Privacy Policy, our Terms and Conditions, and applicable operational requirements.
        </p>
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
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Contact for privacy matters</h2>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          For privacy-related questions, account data enquiries, or support requests, contact us at <strong>{supportEmail}</strong> or <strong>{supportPhoneDisplay}</strong>.
        </p>
      </section>
    </InfoPageLayout>
  );
}
