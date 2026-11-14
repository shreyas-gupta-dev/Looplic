"use client";

import { AlertOctagon, CheckCircle2, XCircle, ShieldAlert } from "lucide-react";

export function RecoveryEmergencyGuide() {
  const donts = [
    {
      title: "Never Power On a Clicking or Grinding Drive",
      desc: "Clicking sounds indicate the read/write head assembly is physically colliding with spinning platters (5,400 to 7,200 RPM). Every second the drive runs can scrape off the magnetic substrate where your data lives.",
    },
    {
      title: "Never Run CHKDSK, fsck, or Generic 'Repair' Tools",
      desc: "Windows CHKDSK and disk utility tools assume hardware is healthy. On drives with failing heads or bad sectors, they aggressively re-write corrupted blocks, permanently destroying original file tables.",
    },
    {
      title: "Never Open the Hard Drive Cover at Home",
      desc: "Modern drive heads fly less than 3 nanometers above platters. A single airborne dust particle is 100x larger than this gap. Opening a drive outside an ISO-standard laminar flow clean bench destroys platters instantly.",
    },
    {
      title: "Never Try Internet Myths (Freezer Trick, Tapping, Shaking)",
      desc: "Freezing a drive introduces internal moisture condensation that shorts controller circuits and oxidizes magnetic platters. Shaking or tapping bends spindle bearings and head suspensions.",
    },
  ];

  const dos = [
    {
      title: "Safely Disconnect and Power Off Immediately",
      desc: "Shut down your operating system immediately or safely disconnect the external USB cable. Preserving the exact state of magnetic platters or SSD NAND chips is your highest priority.",
    },
    {
      title: "Note Down Symptoms and Circumstances",
      desc: "Record whether you heard beeping, clicking, smelled burning electronics, experienced a liquid spill, or suffered a power surge. This diagnostic context speeds up lab triage.",
    },
    {
      title: "Package in Cushioning and Anti-Static Protection",
      desc: "Wrap the storage device in bubble wrap (at least 2–3 inches thick) inside a rigid cardboard box to prevent vibration damage during doorstep transport or courier shipping.",
    },
    {
      title: "Consult a Specialized Cleanroom Recovery Lab",
      desc: "Arrange a professional diagnostic inspection where certified hardware imagers clone unstable sectors at the hardware level without stressing damaged drive assemblies.",
    },
  ];

  return (
    <section className="bg-slate-900 py-16 text-white md:py-24">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-950/60 px-3.5 py-1.5 text-xs font-semibold text-amber-300">
            <AlertOctagon className="size-3.5 text-amber-400" />
            <span>Emergency Drive Failure Protocol</span>
          </div>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-4xl">
            What to Do (and What NOT to Do) When Your Drive Fails
          </h2>
          <p className="mt-3 text-sm text-slate-300 sm:text-base">
            The immediate steps you take in the first 15 minutes of storage failure often decide whether 100% of your critical data can be rescued.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Critical DON'Ts */}
          <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-6 sm:p-8 backdrop-blur-sm">
            <div className="flex items-center gap-3 border-b border-rose-500/20 pb-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400">
                <XCircle className="size-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Critical DON&apos;Ts</h3>
                <p className="text-xs text-rose-300">Actions that lead to irreversible platter and NAND data loss</p>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {donts.map((item, i) => (
                <div key={i} className="flex items-start gap-3.5">
                  <span className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-rose-950 text-xs font-bold text-rose-400 border border-rose-500/40">
                    ✕
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">{item.title}</h4>
                    <p className="mt-1 text-xs leading-relaxed text-slate-300">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Critical DOs */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-6 sm:p-8 backdrop-blur-sm">
            <div className="flex items-center gap-3 border-b border-emerald-500/20 pb-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="size-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Immediate DOs</h3>
                <p className="text-xs text-emerald-300">Safe steps to maximize recoverable file percentage</p>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {dos.map((item, i) => (
                <div key={i} className="flex items-start gap-3.5">
                  <span className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-950 text-xs font-bold text-emerald-400 border border-emerald-500/40">
                    ✓
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">{item.title}</h4>
                    <p className="mt-1 text-xs leading-relaxed text-slate-300">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
