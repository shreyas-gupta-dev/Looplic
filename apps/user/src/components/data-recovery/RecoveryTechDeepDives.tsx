"use client";

import { AlertTriangle, Disc, Cpu } from "lucide-react";
import { RECOVERY_TOKENS } from "./recovery-tokens";

export function RecoveryTechDeepDives() {
  return (
    <section className={`bg-slate-50 ${RECOVERY_TOKENS.layout.sectionPadding} border-b border-slate-200`}>
      <div className={RECOVERY_TOKENS.layout.container}>
        {/* Section Header */}
        <div className="max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
            Laboratory Engineering
          </span>
          <h2 className="mt-3 font-display text-2xl sm:text-3xl lg:text-[40px] font-bold tracking-tight text-slate-900 leading-[1.2]">
            Why Mechanical & Encrypted Media Require Hardware Cleanrooms
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-700 leading-relaxed">
            Storage media operate at microscopic tolerances. Safe recovery requires isolated clean air workstations and board-level diagnostic tools.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* ─── Mechanical HDD Deep Dive ────────────────────────────────────── */}
          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-8">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-lg bg-slate-100 text-slate-900">
                  <Disc className="size-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Mechanical Hard Drives & Clicking
                  </h3>
                  <span className="text-xs font-semibold text-emerald-700">Platter inspection · Head swaps · Firmware repair</span>
                </div>
              </div>

              <p className="mt-5 text-sm text-slate-700 leading-relaxed">
                Read/write heads fly nanometers above platters spinning at 7,200 RPM. When dropped or worn, head assemblies crash against platters, creating physical damage.
              </p>

              <div className="mt-6 space-y-3 rounded-lg bg-slate-50 p-4 border border-slate-200/80">
                <div className="text-xs text-slate-800">
                  <strong className="text-slate-900 block font-semibold mb-0.5">1. Laminar Flow Clean Benches:</strong>
                  Opening drives in unconditioned room air introduces dust particles that permanently score magnetic coatings.
                </div>
                <div className="text-xs text-slate-800">
                  <strong className="text-slate-900 block font-semibold mb-0.5">2. Matched Donor Heads:</strong>
                  Replacement head sliders require matching microcode revisions and preamp revisions from identical donor units.
                </div>
                <div className="text-xs text-slate-800">
                  <strong className="text-slate-900 block font-semibold mb-0.5">3. Firmware Terminal Rebuilds:</strong>
                  Corrupted defect lists and service area (SA) translator modules are rebuilt through diagnostic terminals.
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-start gap-3 rounded-lg border border-slate-300 bg-slate-100 p-4">
              <AlertTriangle className="size-4 shrink-0 text-slate-800 mt-0.5" />
              <div className="text-xs text-slate-800 leading-relaxed">
                <strong className="text-slate-900">Clicking Drive Protocol:</strong> Power off immediately. Every revolution with damaged heads scratches magnetic platters and destroys data permanently.
              </div>
            </div>
          </div>

          {/* ─── Apple Mac & Silicon NAND Deep Dive ─────────────────────────── */}
          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-8">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-lg bg-slate-100 text-slate-900">
                  <Cpu className="size-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    MacBook & Apple Silicon Logic Boards
                  </h3>
                  <span className="text-xs font-semibold text-emerald-700">M1/M2/M3/M4 · T2 Security · Soldered NAND</span>
                </div>
              </div>

              <p className="mt-5 text-sm text-slate-700 leading-relaxed">
                Modern MacBooks solder flash storage directly to logic boards. Cryptographic keys are stored within the Secure Enclave Processor (SEP), making chip-off reading impossible.
              </p>

              <div className="mt-6 space-y-3 rounded-lg bg-slate-50 p-4 border border-slate-200/80">
                <div className="text-xs text-slate-800">
                  <strong className="text-slate-900 block font-semibold mb-0.5">1. Board-Level Component Repair:</strong>
                  Engineers trace shorted power rails (PPBUS_G3H, 3V3_G3H) and repair liquid-damaged circuits to restore board communication.
                </div>
                <div className="text-xs text-slate-800">
                  <strong className="text-slate-900 block font-semibold mb-0.5">2. Diagnostic DFU Mode Handshake:</strong>
                  Once power sequencing is stabilized, boards are brought into recovery mode to negotiate decryption with the onboard SEP.
                </div>
                <div className="text-xs text-slate-800">
                  <strong className="text-slate-900 block font-semibold mb-0.5">3. Hardware Decrypted Volume Dump:</strong>
                  The unlocked APFS container is cloned directly over high-speed target connections without booting the operating system.
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-start gap-3 rounded-lg border border-slate-300 bg-slate-100 p-4">
              <AlertTriangle className="size-4 shrink-0 text-slate-800 mt-0.5" />
              <div className="text-xs text-slate-800 leading-relaxed">
                <strong className="text-slate-900">Liquid Damage Protocol:</strong> Never connect chargers to wet laptops. Voltage on corroded traces burns through internal board layers, permanently destroying the CPU.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
