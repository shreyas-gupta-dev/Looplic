"use client";

import { AlertTriangle, Disc, Wrench, ShieldAlert, Cpu, Sparkles } from "lucide-react";

export function RecoveryTechDeepDives() {
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
            Inside the Recovery Lab
          </span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Why Mechanical & Encrypted Drives Need Lab-Grade Care
          </h2>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            Modern storage devices are precision microscopic machines. Understanding what failed protects your data from permanent destruction.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* ─── Mechanical HDD Deep Dive ────────────────────────────────────── */}
          <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-slate-900 p-7 text-white shadow-xl sm:p-9">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Disc className="size-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white sm:text-xl">
                    Mechanical Hard Drives & Clicking Failures
                  </h3>
                  <span className="text-xs text-emerald-400">Head crashes · Platter damage · Motor seizure</span>
                </div>
              </div>

              <p className="mt-5 text-xs leading-relaxed text-slate-300 sm:text-sm">
                Inside a spinning hard drive, read/write heads fly mere nanometers above magnetic platters spinning at 5,400 to 7,200 RPM. When a drive is dropped, experiences sudden power loss, or suffers age-related wear, the delicate head slider crashes onto the platter surface.
              </p>

              <div className="mt-6 space-y-3 rounded-2xl bg-slate-800/80 p-4 text-xs text-slate-200">
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                    1
                  </span>
                  <div>
                    <strong className="text-white">Clean Air Environment:</strong>
                    <p className="text-slate-400">Opening a hard drive in regular room air exposes platters to millions of microscopic dust particles that permanently gouge the magnetic film.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                    2
                  </span>
                  <div>
                    <strong className="text-white">Donor Head Assembly Matching:</strong>
                    <p className="text-slate-400">Replacement heads must match the exact microcode, pre-amp chip revision, and platter geometry to successfully read data.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                    3
                  </span>
                  <div>
                    <strong className="text-white">Firmware SA Rebuilding:</strong>
                    <p className="text-slate-400">Damaged translator tables and corrupted defect lists (P-list/G-list) are patched using specialized hardware diagnostic terminals.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Warning Callout */}
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-950/40 p-4 text-xs text-amber-200">
              <AlertTriangle className="size-5 shrink-0 text-amber-400" />
              <div>
                <strong className="block text-amber-300">Urgent Caution for Clicking Drives:</strong>
                <span>Never shake, tap, freeze, or repeatedly power cycle a clicking drive. Every second of power spins failed heads against platters, turning recoverable data into permanent dust rings.</span>
              </div>
            </div>
          </div>

          {/* ─── Apple Mac & Silicon NAND Deep Dive ─────────────────────────── */}
          <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-slate-900 p-7 text-white shadow-xl sm:p-9">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-teal-500/20 text-teal-400">
                  <Cpu className="size-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white sm:text-xl">
                    MacBook & Apple Silicon Board-Level Recovery
                  </h3>
                  <span className="text-xs text-teal-400">T2 Security Chip · M1 / M2 / M3 / M4 · Soldered NAND</span>
                </div>
              </div>

              <p className="mt-5 text-xs leading-relaxed text-slate-300 sm:text-sm">
                In modern Apple MacBooks, there is no removable SSD drive. Flash NAND storage chips are soldered directly onto the logic board. More importantly, data is encrypted on-the-fly with hardware keys tied uniquely to the CPU and Secure Enclave Processor (SEP).
              </p>

              <div className="mt-6 space-y-3 rounded-2xl bg-slate-800/80 p-4 text-xs text-slate-200">
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-teal-400 font-bold text-[10px]">
                    1
                  </span>
                  <div>
                    <strong className="text-white">Why Chip-Off Fails on Apple Silicon:</strong>
                    <p className="text-slate-400">Removing NAND chips to read them on a programmer yields only raw scrambled ciphertext. The data cannot be decrypted without the host processor.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-teal-400 font-bold text-[10px]">
                    2
                  </span>
                  <div>
                    <strong className="text-white">Micro-Soldering Logic Board Revival:</strong>
                    <p className="text-slate-400">Our engineers trace failed power rails (PPBUS_G3H, 3V3_G3H), replace shorted capacitors, and repair liquid corrosion to power the board into DFU diagnostic mode.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-teal-400 font-bold text-[10px]">
                    3
                  </span>
                  <div>
                    <strong className="text-white">Direct Raw Disk Imaging:</strong>
                    <p className="text-slate-400">Once communication is established, we dump the decrypted disk volume directly over high-speed Thunderbolt without booting macOS.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mac Warning Callout */}
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-teal-500/30 bg-teal-950/40 p-4 text-xs text-teal-200">
              <Sparkles className="size-5 shrink-0 text-teal-400" />
              <div>
                <strong className="block text-teal-300">Liquid Spill or Dead Mac Advice:</strong>
                <span>Do not connect the charger to a liquid-damaged Mac. Charging accelerates galvanic corrosion across copper traces under high-voltage backlight rails. Bring it to the lab dry.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
