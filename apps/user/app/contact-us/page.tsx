import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import Image from "next/image";

import { ContactLeadForm } from "@/src/components/next/ContactLeadForm";
import { InfoPageLayout } from "@/src/components/next/InfoPageLayout";
import { companyAddress, companyAddressMapUrl, companyName, supportEmail, supportPhone, supportPhoneDisplay, whatsappPhoneDisplay, whatsappUrl } from "@/src/lib/company";
import { buildPageMetadata } from "@/src/lib/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Contact Us",
  description: `Contact ${companyName} for booking help, order updates, WhatsApp support, and service enquiries in Bangalore. Reach our team for doorstep repair and IT support.`,
  pathname: "/contact-us",
});

export default function ContactUsPage() {
  return (
    <InfoPageLayout
      eyebrow="Support"
      title="Contact Looplic"
      description="Reach us for order help, service questions, customer support, partnership enquiries, or assistance with existing bookings. We keep our support channels clear so customers can connect without delay."
    >
      <section className="grid gap-4 md:grid-cols-3">
        <a href={`tel:+91${supportPhone}`} className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/30">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Phone className="size-5" />
          </div>
          <h2 className="mt-4 text-lg font-semibold tracking-tight text-foreground">Call us</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Speak with us for support, booking help, and service-related queries.</p>
          <div className="mt-4 text-sm font-semibold text-foreground">{supportPhoneDisplay}</div>
        </a>

        <a href={`mailto:${supportEmail}`} className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/30">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Mail className="size-5" />
          </div>
          <h2 className="mt-4 text-lg font-semibold tracking-tight text-foreground">Email us</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Use email for support follow-ups, documentation, and detailed requests.</p>
          <div className="mt-4 break-all text-sm font-semibold text-foreground">{supportEmail}</div>
        </a>

        <a href={whatsappUrl} target="_blank" rel="noreferrer" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm transition-colors hover:border-emerald-300">
          <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <Image src="/whatsapp.svg" alt="" width={20} height={20} className="size-5" aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-lg font-semibold tracking-tight text-foreground">WhatsApp</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Start a chat for fast support and booking-related communication.</p>
          <div className="mt-4 text-sm font-semibold text-emerald-700">Message us on WhatsApp</div>
        </a>
      </section>

      <section className="grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
        <ContactLeadForm />

        <article className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Customer support scope</h2>
          <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground">
            <p>We can help with booking guidance, order updates, support contact, device/service questions, and general customer assistance related to the Looplic platform.</p>
            <p>Response times can vary depending on demand, service hours, and the nature of the request. For urgent booking-related issues, phone or WhatsApp is usually the fastest path.</p>
            <p>When contacting us, please share enough detail for us to help efficiently, such as your name, booking code if available, device information, and the issue you need assistance with.</p>
          </div>
        </article>

        <article className="rounded-2xl border border-border bg-card p-6 shadow-sm md:col-span-2">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Business details</h2>
          <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground">
            <div className="flex gap-3">
              <MapPin className="mt-1 size-4 shrink-0 text-primary" />
              <div>
                <div className="font-semibold text-foreground">Visit us</div>
                <a href={companyAddressMapUrl} target="_blank" rel="noreferrer" className="transition-colors hover:text-primary">
                  {companyAddress}
                </a>
              </div>
            </div>
            <div>
              <div className="font-semibold text-foreground">Email</div>
              <div>{supportEmail}</div>
            </div>
            <div>
              <div className="font-semibold text-foreground">Phone</div>
              <div>{supportPhoneDisplay}</div>
            </div>
            <div>
              <div className="font-semibold text-foreground">WhatsApp</div>
              <div>{whatsappPhoneDisplay}</div>
            </div>
          </div>
        </article>
      </section>
    </InfoPageLayout>
  );
}
