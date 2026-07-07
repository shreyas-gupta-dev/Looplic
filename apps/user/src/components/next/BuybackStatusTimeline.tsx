import { Check, X } from "lucide-react";

import { BUYBACK_STATUS_LABELS, BUYBACK_STATUS_STEPS } from "@/src/lib/data/buyback-bookings";

// Vertical status timeline for a buyback booking. quote_requested renders as a
// single informational step; cancelled short-circuits the whole timeline.
export function BuybackStatusTimeline({ status }: { status: string }) {
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-2.5 rounded-xl bg-red-50 px-4 py-3">
        <span className="flex size-6 items-center justify-center rounded-full bg-red-500"><X className="size-3.5 text-white" /></span>
        <span className="text-[13px] font-bold text-red-600">This booking was cancelled</span>
      </div>
    );
  }

  if (status === "quote_requested") {
    return (
      <div className="rounded-xl bg-sky-50 px-4 py-3 text-[13px] font-semibold text-sky-700">
        Quote requested — our team will call you with the best price shortly.
      </div>
    );
  }

  const currentIndex = BUYBACK_STATUS_STEPS.indexOf(status as (typeof BUYBACK_STATUS_STEPS)[number]);

  return (
    <ol className="space-y-0">
      {BUYBACK_STATUS_STEPS.map((step, index) => {
        const reached = currentIndex >= index;
        const isLast = index === BUYBACK_STATUS_STEPS.length - 1;
        return (
          <li key={step} className="relative flex gap-3 pb-5 last:pb-0">
            {!isLast ? (
              <span className={`absolute left-[11px] top-6 h-[calc(100%-1.25rem)] w-0.5 ${currentIndex > index ? "bg-emerald-400" : "bg-gray-200"}`} />
            ) : null}
            <span
              className={`z-10 flex size-6 shrink-0 items-center justify-center rounded-full border-2 ${
                reached ? "border-emerald-400 bg-emerald-400" : "border-gray-300 bg-white"
              }`}
            >
              {reached ? <Check className="size-3.5 text-white" /> : null}
            </span>
            <span className={`text-[13px] ${reached ? "font-bold text-gray-900" : "font-medium text-gray-400"}`}>
              {BUYBACK_STATUS_LABELS[step]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
