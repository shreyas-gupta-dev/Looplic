"use client";

import { AlertOctagon, CheckCircle2, XCircle } from "lucide-react";
import { RecoveryButton } from "./RecoveryButton";

export function RecoveryEmergencyGuide() {
  const donts = [
    {
      title: "Never power on a clicking or grinding drive",
      desc: "Clicking means heads are hitting spinning platters at 7,200 RPM. Running it scrapes off the magnetic layer holding your data.",
    },
    {
      title: "Never run CHKDSK or generic 'repair' utilities",
      desc: "Windows disk check assumes healthy hardware. On failing media, it forces writes that overwrite original file directory tables.",
    },
    {
      title: "Never open the drive enclosure at home",
      desc: "Read heads fly nanometers above platters. A single airborne dust speck is 100x larger than this gap and damages platters instantly.",
    },
    {
      title: "Avoid internet myths (freezer, tapping, shaking)",
      desc: "Freezing causes internal condensation that shorts circuits. Tapping bends spindle bearings and head suspensions.",
    },
  ];

  const dos = [
    {
      title: "Disconnect and power off immediately",
      desc: "Safely unplug power or external USB cable immediately to freeze the physical state of your platters or NAND chips.",
    },
    {
      title: "Note down symptoms and failure context",
      desc: "Record whether you heard clicking, smelled burning, or had a power surge. This diagnostic context speeds up triage.",
    },
    {
      title: "Package in anti-static cushioning",
      desc: "Wrap the device in 2–3 inches of bubble wrap inside a rigid box to prevent shock during doorstep pickup or courier transit.",
    },
    {
      title: "Book a certified cleanroom inspection",
      desc: "Our lab creates sector-by-sector clones on hardware imagers without stressing unstable read heads.",
    },
  ];

  return (
    <section id="emergency" className="bg-slate-50 py-16 text-slate-900 sm:py-24">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3.5 py-1.5 text-xs font-bold text-rose-800">
            <AlertOctagon className="size-3.5 text-rose-600" />
            <span>Emergency Storage Protocol</span>
          </div>
          <h2 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Critical Steps When Your Drive Fails
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-700 sm:text-base">
            Actions taken in the first 15 minutes decide whether your files are safely recoverable.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Critical DON'Ts */}
          <div className="rounded-2xl border border-rose-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3 border-b border-rose-100 pb-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                <XCircle className="size-6" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900">What NOT to Do</h3>
                <p className="text-xs font-medium text-rose-700">Actions causing irreversible platter and NAND loss</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {donts.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-rose-50 text-xs font-bold text-rose-700 border border-rose-200">
                    ✕
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Critical DOs */}
          <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3 border-b border-emerald-100 pb-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="size-6" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900">What to Do Immediately</h3>
                <p className="text-xs font-medium text-emerald-700">Safe steps to protect your data recovery odds</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {dos.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700 border border-emerald-200">
                    ✓
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Single section primary CTA */}
        <div className="mt-10 text-center">
          <RecoveryButton href="#book" variant="primary">
            Request Cleanroom Diagnostics →
          </RecoveryButton>
        </div>
      </div>
    </section>
  );
}
