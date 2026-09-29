import { Check, Clock, PauseCircle, X } from "lucide-react";

import {
  BOOKING_STATUS_FLOW,
  BOOKING_STATUS_META,
  type BookingStatus,
} from "@looplic/db/booking-status";

/**
 * Customer-facing status timeline for a repair order.
 *
 * Generalised from BuybackStatusTimeline so repair and sell tracking look the
 * same, but driven by the canonical status model rather than a hardcoded step
 * list — so adding a step to the journey updates every timeline at once.
 *
 * Renders the full expected journey with completed steps ticked and the current
 * one highlighted, because "what happens next" is most of what a customer wants
 * from a tracking page. Cancelled and on-hold orders short-circuit: showing a
 * progress bar for an order that is not progressing would be misleading.
 */

export type StatusTimelineEvent = {
  status: BookingStatus;
  note?: string | null;
  at: string;
};

type StatusTimelineProps = {
  status: BookingStatus;
  events?: StatusTimelineEvent[];
};

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function StatusTimeline({ status, events = [] }: StatusTimelineProps) {
  if (status === "cancelled") {
    return (
      <div className="flex items-start gap-2.5 rounded-xl bg-red-50 px-4 py-3">
        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-red-500">
          <X className="size-3.5 text-white" aria-hidden="true" />
        </span>
        <div>
          <p className="text-[13px] font-bold text-red-600">{BOOKING_STATUS_META.cancelled.label}</p>
          <p className="mt-0.5 text-[12px] text-red-500">{BOOKING_STATUS_META.cancelled.customerDescription}</p>
        </div>
      </div>
    );
  }

  if (status === "on_hold") {
    return (
      <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 px-4 py-3">
        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-500">
          <PauseCircle className="size-3.5 text-white" aria-hidden="true" />
        </span>
        <div>
          <p className="text-[13px] font-bold text-amber-700">{BOOKING_STATUS_META.on_hold.label}</p>
          <p className="mt-0.5 text-[12px] text-amber-600">{BOOKING_STATUS_META.on_hold.customerDescription}</p>
        </div>
      </div>
    );
  }

  // Steps shown: the standard journey, plus "completed" as the closing step.
  const steps: BookingStatus[] = [...BOOKING_STATUS_FLOW, "completed"];
  const currentIndex = steps.indexOf(status);

  // When each step actually happened, taken from the recorded history.
  const reachedAt = new Map<BookingStatus, string>();
  for (const event of events) {
    if (!reachedAt.has(event.status)) reachedAt.set(event.status, event.at);
  }
  const noteFor = new Map<BookingStatus, string>();
  for (const event of events) {
    if (event.note) noteFor.set(event.status, event.note);
  }

  return (
    <ol className="space-y-0">
      {steps.map((step, index) => {
        const reached = currentIndex >= index;
        const isCurrent = currentIndex === index;
        const isLast = index === steps.length - 1;
        const meta = BOOKING_STATUS_META[step];
        const at = reachedAt.get(step);
        const note = noteFor.get(step);

        return (
          <li key={step} className="relative flex gap-3 pb-5 last:pb-0">
            {!isLast ? (
              <span
                aria-hidden="true"
                className={`absolute left-[11px] top-6 h-[calc(100%-1.25rem)] w-0.5 ${
                  currentIndex > index ? "bg-brand-400" : "bg-gray-200"
                }`}
              />
            ) : null}

            <span
              aria-hidden="true"
              className={`z-10 flex size-6 shrink-0 items-center justify-center rounded-full border-2 ${
                isCurrent
                  ? "border-brand-500 bg-white ring-4 ring-brand-100"
                  : reached
                    ? "border-brand-400 bg-brand-400"
                    : "border-gray-300 bg-white"
              }`}
            >
              {isCurrent ? (
                <Clock className="size-3 text-brand-600" />
              ) : reached ? (
                <Check className="size-3.5 text-white" />
              ) : null}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span
                  className={`text-[13px] ${
                    isCurrent
                      ? "font-bold text-brand-700"
                      : reached
                        ? "font-bold text-gray-900"
                        : "font-medium text-gray-400"
                  }`}
                >
                  {meta.label}
                </span>
                {at ? <span className="text-[11px] text-gray-400">{formatTimestamp(at)}</span> : null}
              </div>

              {isCurrent ? (
                <p className="mt-0.5 text-[12px] text-gray-600">{meta.customerDescription}</p>
              ) : null}

              {note ? (
                <p className="mt-1 rounded-lg bg-gray-50 px-2.5 py-1.5 text-[12px] text-gray-600">{note}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
