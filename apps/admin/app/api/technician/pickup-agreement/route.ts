import { NextResponse } from "next/server";

import { formatBookingServiceType } from "@/src/lib/bookings";
import { sendPickupAgreementEmail } from "@/src/lib/email/resend";
import { createPickupAgreementPdfBytes, type PickupAgreementPdf } from "@/src/lib/invoice-pdf";
import { getServerSession, adminGetUser } from "@/src/lib/auth/cognito-server";
import { db } from "@/src/lib/db";
import { bookings, userRoles } from "@/src/lib/db/schema";
import { eq, and } from "drizzle-orm";

function asText(value: unknown) {
  return String(value ?? "").trim();
}

function cleanDateTime(value: unknown) {
  const text = asText(value);
  if (!text) return "";
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return text;
  return parsed.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function requireTechnicianBooking(bookingId: string) {
  if (!bookingId) {
    return { response: NextResponse.json({ ok: false, error: "Booking is required." }, { status: 400 }) };
  }

  const session = await getServerSession();
  if (!session.user) {
    return { response: NextResponse.json({ ok: false, error: "Sign in as a technician to send pickup agreements." }, { status: 401 }) };
  }

  const role = await db.select().from(userRoles)
    .where(and(eq(userRoles.userId, session.user.id), eq(userRoles.role, "technician")))
    .limit(1);

  if (role.length === 0) {
    return { response: NextResponse.json({ ok: false, error: "Technician access is required." }, { status: 403 }) };
  }

  const booking = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
  if (booking.length === 0) {
    return { response: NextResponse.json({ ok: false, error: "Booking was not found." }, { status: 404 }) };
  }

  const b = booking[0];
  if (asText(b.assignedRider).toLowerCase() !== asText(session.user.email).toLowerCase()) {
    return { response: NextResponse.json({ ok: false, error: "This booking is not assigned to you." }, { status: 403 }) };
  }

  return { booking: b, user: session.user };
}

async function getCustomerEmailFromBooking(userId: string | null) {
  if (!userId) return "";
  try {
    const authUser = await adminGetUser(userId);
    return asText(authUser?.email).toLowerCase();
  } catch {
    return "";
  }
}

export async function GET(request: Request) {
  const bookingId = asText(new URL(request.url).searchParams.get("bookingId"));
  const result = await requireTechnicianBooking(bookingId);
  if ("response" in result) return result.response;
  return NextResponse.json({ ok: true, email: await getCustomerEmailFromBooking(result.booking.userId) });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const bookingId = asText(body?.bookingId);
  const pickupDateTime = asText(body?.pickupDateTime);
  const dropDateTime = asText(body?.dropDateTime);
  const pickupPerson = asText(body?.pickupPerson);
  const pickupAddress = asText(body?.pickupAddress);
  const issue = asText(body?.issue);
  const deviceCondition = asText(body?.deviceCondition);
  const accessories = asText(body?.accessories);
  const notes = asText(body?.notes);
  const estimatedQuote = asText(body?.estimatedQuote);

  const authResult = await requireTechnicianBooking(bookingId);
  if ("response" in authResult) return authResult.response;

  const { booking, user } = authResult;
  const customerEmail = (asText(body?.customerEmail) || await getCustomerEmailFromBooking(booking.userId)).toLowerCase();

  if (!customerEmail || !isValidEmail(customerEmail)) {
    return NextResponse.json({ ok: false, error: "Valid customer email is required." }, { status: 400 });
  }

  if (!pickupDateTime || !dropDateTime || !pickupPerson || !pickupAddress || !issue || !deviceCondition || !accessories) {
    return NextResponse.json({ ok: false, error: "Complete pickup, drop, customer, issue, condition, and accessories details." }, { status: 400 });
  }

  const agreementNumber = `${booking.bookingCode || booking.id}-PICKUP`;
  const deviceLabel = asText(body?.deviceLabel) || "Device details pending";
  const agreement: PickupAgreementPdf = {
    agreementNumber,
    bookingCode: booking.bookingCode,
    customerName: booking.customerName,
    customerPhone: booking.customerPhone,
    customerEmail,
    serviceLabel: asText(body?.serviceLabel) || formatBookingServiceType(booking.serviceType),
    deviceLabel,
    issue,
    deviceCondition,
    accessories,
    estimatedQuote: estimatedQuote || null,
    pickupDateTime: cleanDateTime(pickupDateTime),
    dropDateTime: cleanDateTime(dropDateTime),
    pickupAddress,
    pickupPerson,
    technicianEmail: user.email || "",
    notes,
  };

  const pdfFilename = `${agreementNumber.toLowerCase()}-agreement.pdf`.replace(/[^a-z0-9.-]+/g, "-");
  const pdfBase64 = Buffer.from(createPickupAgreementPdfBytes(agreement), "binary").toString("base64");
  const emailResult = await sendPickupAgreementEmail({
    to: customerEmail,
    customerName: agreement.customerName,
    bookingCode: agreement.bookingCode,
    customerPhone: agreement.customerPhone,
    serviceLabel: agreement.serviceLabel,
    deviceLabel: agreement.deviceLabel,
    issue: agreement.issue,
    deviceCondition: agreement.deviceCondition,
    accessories: agreement.accessories,
    pickupDateTime: agreement.pickupDateTime,
    dropDateTime: agreement.dropDateTime,
    pickupAddress: agreement.pickupAddress,
    pickupPerson: agreement.pickupPerson,
    technicianEmail: agreement.technicianEmail,
    estimatedQuote: agreement.estimatedQuote,
    notes: agreement.notes,
    pdfBase64,
    pdfFilename,
  });

  if (!emailResult.ok) {
    const errorMessage = "error" in emailResult ? emailResult.error : "Unable to send pickup agreement email.";
    return NextResponse.json({ ok: false, error: errorMessage || "Unable to send pickup agreement email." }, { status: (emailResult as any).status || 500 });
  }

  return NextResponse.json({ ok: true });
}
