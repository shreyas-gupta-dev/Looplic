import { ShieldCheck } from "lucide-react";

import { getRepairWarranty, type RepairWarranty } from "@/src/lib/repair-warranty";

type RepairWarrantyTagProps = {
  className?: string;
  subcategoryName?: string;
};

const toneClass: Record<RepairWarranty["tone"], string> = {
  premium: "border-emerald-200 bg-emerald-50 text-emerald-700",
  standard: "border-sky-200 bg-sky-50 text-sky-700",
  service: "border-amber-200 bg-amber-50 text-amber-700",
};

export function RepairWarrantyTag({ className = "", subcategoryName }: RepairWarrantyTagProps) {
  const warranty = subcategoryName ? getRepairWarranty(subcategoryName) : null;

  if (!warranty) {
    return null;
  }

  return (
    <span className={`inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-black leading-none ${toneClass[warranty.tone]} ${className}`}>
      <ShieldCheck className="size-3 shrink-0" />
      <span className="truncate">{warranty.label}</span>
    </span>
  );
}
