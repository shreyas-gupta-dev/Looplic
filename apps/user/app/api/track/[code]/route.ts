import { NextResponse } from "next/server";

import { serviceLabelFor, trackBooking } from "@/src/lib/data/booking-tracking";
import { guardRateLimit } from "@/src/lib/rate-limit";

/**
 * GET /api/track/[code]?phone=...
 *
 * JSON view of a repair order's status and history, for the tracking page to poll
 * so a customer watching an active repair sees each step arrive without
 * refreshing.
 *
 * Authorization is the same as the tracking page: booking code AND phone must
 * both match. Every failure answers 404 with the same body, so the endpoint cannot
 * be used to work out which booking codes exist.
 */
export async function GET(request: Request, context: { params: Promise<{ code: string }> }) {
  const limited = await guardRateLimit(request, "api:track", 60, 600);
  if (limited) return limited;

  const notFound = NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const { code } = await context.params;
    const phone = new URL(request.url).searchParams.get("phone") ?? "";

    if (!code || !phone) return notFound;

    const booking = await trackBooking(code, phone);
    if (!booking) return notFound;

    return NextResponse.json(
      {
        bookingCode: booking.bookingCode,
        status: booking.status,
        statusLabel: booking.statusLabel,
        statusDescription: booking.statusDescription,
        timelineIndex: booking.timelineIndex,
        nextStatus: booking.nextStatus,
        nextStatusLabel: booking.nextStatusLabel,
        serviceLabel: serviceLabelFor(booking.serviceType),
        deviceLabel: booking.deviceLabel,
        repairLabel: booking.repairLabel,
        scheduledDate: booking.scheduledDate,
        timeSlot: booking.timeSlot,
        createdAt: booking.createdAt,
        history: booking.history,
      },
      // Never cached: the whole point is that it reflects the current status.
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[track] lookup failed:", error);
    // Do not distinguish an internal failure from a miss.
    return notFound;
  }
}
