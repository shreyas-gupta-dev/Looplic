import { Instagram, Linkedin, Mail, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import logo from "@/assets/looplic-logo.webp";
import { InstallAppButton } from "@/src/components/next/InstallAppButton";
import { companyName, footerLinks, supportEmail, supportPhone, supportPhoneDisplay, whatsappUrl } from "@/src/lib/company";

export function HomepageFooter() {
  return (
    <footer id="contact" className="border-t border-border bg-card py-8">
      <div className="container max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-8">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="overflow-hidden rounded-[28px] border border-border bg-[radial-gradient(circle_at_top_left,_hsl(211_100%_50%_/_0.14),_transparent_35%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(241,245,249,0.92))] p-6 shadow-card-brand">
              <img src={logo.src} alt="Looplic" className="mb-4 h-8" />
              <h3 className="max-w-md text-2xl font-semibold leading-tight text-foreground">
                Fast mobile repair, cleaner booking flow, and real support when customers need it.
              </h3>
              <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
                Doorstep device repair and tech support, built to feel quick, clear, and dependable from first tap to final confirmation.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/service/mobile-repair/brands" className="rounded-full border border-border bg-card px-4 py-2 text-xs font-bold text-foreground transition-colors hover:border-primary/30 hover:text-primary">
                  Browse Brands
                </Link>
                <Link href="/bangalore" className="rounded-full border border-border bg-card px-4 py-2 text-xs font-bold text-foreground transition-colors hover:border-primary/30 hover:text-primary">
                  Bangalore
                </Link>
                <Link href="/service/mobile-repair" className="rounded-full border border-border bg-card px-4 py-2 text-xs font-bold text-foreground transition-colors hover:border-primary/30 hover:text-primary">
                  Mobile Repair
                </Link>
                <InstallAppButton compact />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[28px] border border-border bg-secondary/40 p-5 shadow-card-brand">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">Menu</div>
                <div className="mt-4 grid gap-2 text-sm font-semibold">
                  <Link href="/" className="transition-colors hover:text-foreground">
                    Home
                  </Link>
                  <Link href="/service/mobile-repair/brands" className="transition-colors hover:text-foreground">
                    Services
                  </Link>
                  <Link href="/service-pages" className="transition-colors hover:text-foreground">
                    Service Pages
                  </Link>
                  <Link href="/brand-pages" className="transition-colors hover:text-foreground">
                    Brand Pages
                  </Link>
                  {footerLinks.map((link) => (
                    <Link key={link.href} href={link.href} className="transition-colors hover:text-foreground">
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-border bg-card p-5 shadow-card-brand">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">Support</div>
                <div className="mt-4 flex flex-col gap-2">
                  <a href={`tel:+91${supportPhone}`} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-secondary p-3 text-sm font-semibold text-foreground md:justify-start">
                    <Phone className="size-4" /> {supportPhoneDisplay}
                  </a>
                  <a href={`mailto:${supportEmail}`} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-secondary p-3 text-sm font-semibold text-foreground md:justify-start">
                    <Mail className="size-4" /> {supportEmail}
                  </a>
                  <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700 md:justify-start">
                    <Image src="/whatsapp.svg" alt="" width={16} height={16} className="size-4" aria-hidden="true" /> WhatsApp support
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition-all hover:bg-emerald-100"
              aria-label="WhatsApp support"
            >
              <Image src="/whatsapp.svg" alt="" width={16} height={16} className="size-4" aria-hidden="true" />
            </a>
            <a
              href="https://www.instagram.com/thelooplic/"
              target="_blank"
              rel="noreferrer"
              className="flex size-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 transition-all hover:bg-rose-100"
              aria-label="Looplic on Instagram"
            >
              <Instagram className="size-4" aria-hidden="true" />
            </a>
            <a
              href="https://www.linkedin.com/company/looplic"
              target="_blank"
              rel="noreferrer"
              className="flex size-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700 transition-all hover:bg-sky-100"
              aria-label="Looplic on LinkedIn"
            >
              <Linkedin className="size-4" aria-hidden="true" />
            </a>
          </div>

          <div className="border-t border-border pt-4 text-center">
            <p className="text-[10px] text-muted-foreground">Copyright {new Date().getFullYear()} {companyName}. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
