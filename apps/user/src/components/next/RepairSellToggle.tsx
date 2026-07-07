"use client";

import { IndianRupee, Wrench } from "lucide-react";
import Link from "next/link";

// Pill toggle that switches between the Repair homepage (/) and the Sell
// homepage (/sell). Rendered at the top of both heroes so the two experiences
// feel like one product with two modes.
export function RepairSellToggle({ active }: { active: "repair" | "sell" }) {
  return (
    <div className="mx-auto flex w-full max-w-sm items-center gap-1.5 rounded-full bg-white p-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
      <Link
        href="/"
        aria-current={active === "repair" ? "page" : undefined}
        className={`flex flex-1 items-center justify-center gap-2.5 rounded-full px-3 py-2 transition-all ${
          active === "repair"
            ? "bg-gradient-to-r from-[#0096FF] to-[#00D28E] text-white shadow-sm"
            : "text-gray-800 hover:bg-gray-50"
        }`}
      >
        <span
          className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
            active === "repair" ? "bg-white/20" : "border border-gray-200 bg-white shadow-sm"
          }`}
        >
          <Wrench className={`size-3.5 ${active === "repair" ? "text-white" : "text-gray-700"}`} />
        </span>
        <span className="text-left leading-tight">
          <span className="block text-[13px] font-bold">Repair</span>
          <span className={`block text-[10px] ${active === "repair" ? "text-white/80" : "text-gray-500"}`}>
            Fix your device
          </span>
        </span>
      </Link>

      <Link
        href="/sell"
        aria-current={active === "sell" ? "page" : undefined}
        className={`flex flex-1 items-center justify-center gap-2.5 rounded-full px-3 py-2 transition-all ${
          active === "sell"
            ? "bg-gradient-to-r from-[#4F46E5] to-[#8B3DFF] text-white shadow-sm"
            : "text-gray-800 hover:bg-gray-50"
        }`}
      >
        <span
          className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
            active === "sell" ? "bg-white/20" : "border border-gray-200 bg-white shadow-sm"
          }`}
        >
          <IndianRupee className={`size-3.5 ${active === "sell" ? "text-white" : "text-gray-700"}`} />
        </span>
        <span className="text-left leading-tight">
          <span className="block text-[13px] font-bold">Sell</span>
          <span className={`block text-[10px] ${active === "sell" ? "text-white/80" : "text-gray-500"}`}>
            Get instant cash
          </span>
        </span>
      </Link>
    </div>
  );
}
