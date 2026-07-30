import { buildBookingLocation } from "@/src/lib/bookings";
import { sendCustomerBookingConfirmation, sendLeadEmail } from "@/src/lib/email/resend";
import type { LeadPayload } from "@/src/lib/leads/types";

import {
  createBuybackPickup,
  createDeviceBooking,
  createServiceBooking,
} from "../booking";
import { notifyCustomerBookingConfirmation, notifyTeamNewLead } from "../notify";
import { setLastBookingCode } from "../store";
import { buildBookingNotes, deviceLabel, priceOf, selectionLabel } from "./summary";
import type { FlowContext } from "./types";

// Turns a completed wizard context into a real booking, then fires exactly the
// same notifications a website booking does:
//   • the booking row itself (admin Order Management picks it up unchanged)
//   • the internal lead email (sendLeadEmail)
//   • the customer's confirmation email (sendCustomerBookingConfirmation)
//   • the team's WhatsApp alert (notifyTeamNewLead)
//   • the customer's WhatsApp confirmation (notifyCustomerBookingConfirmation)
// The booking insert is the only step allowed to fail loudly — everything after
// it is best-effort, because a failed email must never make a saved booking
// look unsaved to the customer.

export type SubmitResult = { ok: true; bookingCode: string } | { ok: false; error: string };

export async function submitBooking(waId: string, context: FlowContext): Promise<SubmitResult> {
  const name = (context.name || "").trim();
  const phone = (context.phone || "").trim();
  if (!name || !phone) return { ok: false, error: "missing_details" };

  const location = buildBookingLocation({
    address: context.address || "",
    city: context.city,
    pincode: context.pincode || "",
  });
  const notes = buildBookingNotes(context);

  let bookingCode = "";
  try {
    if (context.kind === "sell") {
      const result = await createBuybackPickup({
        waId,
        customerName: name,
        customerPhone: phone,
        brandName: context.brandName || "",
        modelName: context.modelName || "",
        variantLabel: context.sellVariantLabel || null,
        serviceType: context.catalogType || "mobile",
        quotedAmount: context.sellQuote ?? null,
        quoteBreakdown: context.sellQuote
          ? "WhatsApp guided quote (confirmed at inspection)"
          : "Manual quote — price to be confirmed by the team",
        address: [location, context.pincode].filter(Boolean).join(", ") || null,
        pickupDate: context.scheduledDate || null,
        timeSlot: context.timeSlot || null,
        notes,
      });
      bookingCode = result.bookingCode;
    } else if (context.kind === "repair" || context.kind === "guard") {
      if (!context.modelId) return { ok: false, error: "missing_model" };
      const result = await createDeviceBooking({
        waId,
        customerName: name,
        customerPhone: phone,
        modelId: context.modelId,
        dbServiceType: context.dbServiceType || "mobile_repair",
        repairCategoryId: context.repairCategoryId ?? null,
        repairSubcategoryId: context.repairSubcategoryId ?? null,
        guardType: context.kind === "guard" ? context.guardType ?? null : null,
        location,
        pincode: context.pincode || null,
        scheduledDate: context.scheduledDate || null,
        timeSlot: context.timeSlot || null,
        notes,
      });
      bookingCode = result.bookingCode;
    } else {
      const result = await createServiceBooking({
        waId,
        customerName: name,
        customerPhone: phone,
        serviceType: context.dbServiceType || "it_support",
        location,
        pincode: context.pincode || null,
        scheduledDate: context.scheduledDate || null,
        timeSlot: context.timeSlot || null,
        cctvBrand: context.kind === "cctv" ? context.cctvBrand ?? null : null,
        cctvService: context.kind === "cctv" ? context.cctvService ?? null : null,
        notes,
      });
      bookingCode = result.bookingCode;
    }
  } catch (err) {
    console.error("[whatsapp:flow] booking insert failed", err);
    return { ok: false, error: "insert_failed" };
  }

  const payload: LeadPayload = {
    source: context.kind === "sell" ? "whatsapp-buyback" : "whatsapp-booking",
    title: `WhatsApp ${selectionLabel(context)}${bookingCode ? ` — ${bookingCode}` : ""}`,
    bookingCode,
    customer: { name, phone },
    service: {
      type: context.dbServiceType || null,
      label: selectionLabel(context),
      price: priceOf(context),
    },
    device: context.brandName
      ? { brand: context.brandName, series: context.seriesName, model: context.modelName }
      : undefined,
    schedule: { date: context.scheduledDate || null, timeSlot: context.timeSlot || null },
    address: context.address || null,
    city: context.city || null,
    pincode: context.pincode || null,
    notes,
    metadata: {
      channel: "whatsapp",
      flow: "whatsapp-guided",
      waId,
      kind: context.kind ?? null,
      device: deviceLabel(context) || null,
      variant: context.sellVariantLabel ?? null,
    },
  };

  // Everything below is best-effort: the booking is already saved.
  await Promise.allSettled([
    setLastBookingCode(waId, bookingCode),
    sendLeadEmail(payload).catch((err) => console.error("[whatsapp:flow] lead email failed", err)),
    sendCustomerBookingConfirmation(payload).catch((err) =>
      console.error("[whatsapp:flow] customer email failed", err),
    ),
    notifyTeamNewLead(payload).catch((err) => console.error("[whatsapp:flow] team alert failed", err)),
    notifyCustomerBookingConfirmation(payload).catch((err) =>
      console.error("[whatsapp:flow] customer confirmation failed", err),
    ),
  ]);

  return { ok: true, bookingCode };
}
