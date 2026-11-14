import type { Metadata } from "next";
import { HardDrive, Cpu, Usb, Disc, ShieldCheck, FileKey, CheckCircle2, ChevronRight, Phone, MessageSquare, MapPin } from "lucide-react";
import Link from "next/link";

import { ServiceJsonLd } from "@/src/components/seo/ServiceJsonLd";
import { SimpleServiceDetailPage } from "@/src/components/next/SimpleServiceDetailPage";
import { buildPageMetadata } from "@/src/lib/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Hard Drive Data Recovery Service in Bangalore",
  description: "Professional data recovery for failed hard drives (HDD), SSDs, USB drives, and memory cards. Cleanroom diagnostics, strict confidentiality, and doorstep collection in Bangalore.",
  pathname: "/service/hard-drive-data-recovery",
  keywords: [
    "hard drive data recovery Bangalore",
    "HDD recovery Bangalore",
    "SSD data recovery",
    "recover deleted files",
    "USB data recovery",
    "external hard drive recovery",
  ],
});

const faqItems = [
  {
    q: "My hard drive is making a clicking or buzzing noise. What should I do?",
    a: "Immediately disconnect and power down the drive. Clicking indicates mechanical read/write head assembly failure. Continuing to run the drive can permanently scrape and damage the magnetic platters, making recovery impossible.",
  },
  {
    q: "What types of storage media do you recover?",
    a: "We recover internal and external mechanical Hard Drives (HDD), Solid State Drives (SATA & NVMe SSD), USB flash pen drives, and SD/MicroSD memory cards across major brands like Seagate, Western Digital, Toshiba, Samsung, and SanDisk.",
  },
  {
    q: "How does the data recovery process work?",
    a: "1) Book online to schedule doorstep device collection in Bangalore or courier drop-off. 2) Our lab conducts an initial hardware and logical diagnosis. 3) You receive a diagnostic report and fixed quote with an itemized file list for approval. 4) Data is securely extracted and returned on a secure backup drive.",
  },
  {
    q: "Can I verify my files before paying?",
    a: "Yes. Once extraction is complete, we provide a verified file list of recoverable data for your review before final invoice approval.",
  },
  {
    q: "How is confidentiality and privacy handled?",
    a: "All recovery work is conducted in an isolated offline lab environment under a strict Non-Disclosure Agreement (NDA). Your files are never transferred to internet-connected drives or shared with third parties.",
  },
  {
    q: "What is the estimated turnaround time?",
    a: "[CONFIRM: turnaround time] Standard evaluations typically take 3 to 5 business days, with expedited priority turnaround available for critical enterprise cases.",
  },
];

export default function HardDriveDataRecoveryPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <>
      <ServiceJsonLd
        name="Hard Drive Data Recovery in Bangalore"
        description="Professional cleanroom data recovery for mechanical hard drives (HDD), solid state drives (SSD), USB flash drives, and memory cards in Bangalore."
        path="/service/hard-drive-data-recovery"
        serviceType="Data recovery service"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <SimpleServiceDetailPage
        eyebrow="Hard Drive Data Recovery"
        title="Recover critical files from damaged, clicking, or corrupted drives."
        description="Professional lab diagnostics and recovery for mechanical HDDs, SSDs, USB drives, and memory cards. Safe doorstep device collection across Bangalore, transparent diagnostic reports, and strict NDA confidentiality."
        bookingHref="/book/hard-drive-data-recovery"
        ctaLabel="Book Data Recovery Diagnosis"
        highlights={[
          "HDD, SSD, USB, and memory card recovery",
          "Dedicated cleanroom stations [CONFIRM: cleanroom class]",
          "Verified file list review before final payment",
          "Free doorstep device collection across Bangalore",
        ]}
        services={[
          {
            title: "Mechanical Hard Drives (HDD)",
            text: "Recovery for desktop, laptop, and external drives suffering from clicking noises, head crashes, seized spindle motors, and corrupted firmware.",
            icon: HardDrive,
          },
          {
            title: "Solid State Drives (SSD & NVMe)",
            text: "Specialized chip-level recovery for SATA, M.2 NVMe, and PCIe SSDs with failed controller ICs, corrupt NAND flash, or 0 MB capacity detection.",
            icon: Cpu,
          },
          {
            title: "USB Drives & Memory Cards",
            text: "Direct NAND chip-off extraction for snapped USB connectors, undetected flash pen drives, write-protected SD cards, and corrupted camera memory cards.",
            icon: Usb,
          },
          {
            title: "Accidental Deletion & Formatting",
            text: "Deep filesystem reconstruction for formatted partitions, emptied trash, RAW drives, BitLocker/FileVault lockouts, and deleted business files.",
            icon: Disc,
          },
          {
            title: "Strict Confidentiality & NDA",
            text: "Isolated offline data extraction workstations and legally binding Non-Disclosure Agreements (NDA) protecting sensitive personal and business files.",
            icon: FileKey,
          },
          {
            title: "Transparent Lab Evaluation",
            text: "Upfront diagnostic report detailing drive health, recoverable file percentage, and fixed quote before any recovery work starts.",
            icon: ShieldCheck,
          },
        ]}
        introSections={[
          {
            title: "Why Clicking & Dead Drives Require Lab-Grade Care",
            text: "When a hard drive clicks or buzzes, the read/write heads are physically contacting or unable to align with the spinning platters. Running commercial recovery software repeatedly stresses the drive, grinding away magnetic media. Our lab inspects mechanical drives using laminar flow clean workstations to inspect platters safely without dust contamination.",
          },
          {
            title: "Doorstep Pickup & Safe Chain of Custody",
            text: "Avoid travelling across Bangalore traffic with a fragile hard drive. We coordinate cushioned, anti-static doorstep collection from your home or office, log your device into our secure tracking system with a unique case code, and provide status updates at every stage.",
          },
        ]}
        workflow={[
          "Step 1: Book your diagnosis request online with device details and preferred doorstep collection slot.",
          "Step 2: Cushioned device collection across Bangalore and secure intake logging at our lab.",
          "Step 3: Cleanroom hardware diagnosis, failure analysis, and a fixed quote with recoverable file verification.",
          "Step 4: Secure file extraction, safe transfer to your backup media, and verified return delivery.",
        ]}
        closingTitle="Need emergency data recovery help?"
        closingText="Speak directly with an engineer or schedule your free lab evaluation and doorstep pickup."
        afterContent={
          <div className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
            {/* ─── Frequently Asked Questions ─── */}
            <div className="mb-12">
              <div className="text-center mb-8">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                  Got Questions?
                </span>
                <h3 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
                  Frequently Asked Questions
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Common questions regarding failure symptoms, turnaround times, and file safety.
                </p>
              </div>

              <div className="space-y-3">
                {faqItems.map((faq, i) => (
                  <details
                    key={i}
                    className="group rounded-2xl border border-gray-200 bg-white p-4 transition-colors hover:border-gray-300"
                  >
                    <summary className="flex cursor-pointer items-center justify-between font-semibold text-gray-900 [&::-webkit-details-marker]:hidden">
                      <span className="text-sm sm:text-base pr-4">{faq.q}</span>
                      <ChevronRight className="size-4 shrink-0 text-gray-400 transition-transform group-open:rotate-90" />
                    </summary>
                    <div className="mt-3 border-t border-gray-100 pt-3 text-xs leading-relaxed text-gray-600 sm:text-sm">
                      <p>{faq.a}</p>
                    </div>
                  </details>
                ))}
              </div>
            </div>

            {/* ─── Contact & Lab Location ─── */}
            <div className="rounded-3xl border border-gray-200 bg-slate-50 p-6 sm:p-8">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <Phone className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Call Recovery Lab</h4>
                    <a href="tel:+919845863602" className="mt-1 block text-sm font-bold text-gray-900 hover:text-emerald-600">
                      +91 98458 63602
                    </a>
                    <span className="text-xs text-gray-500">Mon–Sat: 10:00 AM – 8:00 PM IST</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <MessageSquare className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">WhatsApp Consultation</h4>
                    <a
                      href="https://wa.me/919845863602?text=Hi%20Looplic%20Data%20Recovery,%20I%20need%20help%20recovering%20my%20storage%20drive."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block text-sm font-bold text-gray-900 hover:text-emerald-600"
                    >
                      Chat on WhatsApp
                    </a>
                    <span className="text-xs text-gray-500">Direct response from engineer</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <MapPin className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Bangalore Lab Address</h4>
                    <p className="mt-1 text-xs text-gray-700">
                      1st Floor, Shawkat Building, SJP Road, Nagarathpete, Bengaluru 560002
                    </p>
                    <span className="text-xs text-gray-500">Opp. Dasappa Hospital, near Town Hall</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
      />
    </>
  );
}

