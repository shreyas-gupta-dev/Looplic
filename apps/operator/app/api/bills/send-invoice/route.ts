import { NextResponse } from "next/server";
import { and, eq, inArray, sql } from "drizzle-orm";

import { adminGetUser, getServerSession } from "@/src/lib/auth/cognito-server";
import { formatBookingServiceType } from "@/src/lib/bookings";
import { db } from "@/src/lib/db";
import { bookings, serviceBills, userRoles } from "@/src/lib/db/schema";
import { sendInvoiceEmail } from "@/src/lib/email/resend";
import { createInvoicePdfBytes, invoicePdfFilename } from "@/src/lib/invoice-pdf";
import { formatWarrantyLabel } from "@/src/lib/warranty";

export const runtime = "nodejs";

const ALLOWED_ROLES = ["admin", "operation", "technician"] as const;

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Emails the final invoice PDF for a paid bill to the customer. Called by the
// Payments tab right after a bill is marked paid (or created as paid). Sends
// once per bill unless `force` is passed.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const billId = String(body?.billId ?? "").trim();
  const force = body?.force === true;

  if (!billId) {
    return NextResponse.json({ ok: false, error: "billId is required." }, { status: 400 });
  }

  const session = await getServerSession();
  if (!session.user) {
    return NextResponse.json({ ok: false, error: "Sign in to email invoices." }, { status: 401 });
  }

  const roleRows = await db
    .select()
    .from(userRoles)
    .where(and(eq(userRoles.userId, session.user.id), inArray(userRoles.role, [...ALLOWED_ROLES])))
    .limit(1);
  if (roleRows.length === 0) {
    return NextResponse.json({ ok: false, error: "Staff access is required." }, { status: 403 });
  }

  let [bill] = await db.select().from(serviceBills).where(eq(serviceBills.id, billId)).limit(1);
  if (!bill) {
    return NextResponse.json({ ok: false, error: "Bill was not found." }, { status: 404 });
  }

  if ((bill.paymentStatus || "").toLowerCase() !== "paid") {
    return NextResponse.json({ ok: true, emailed: false, reason: "not-paid", message: "Bill is not marked paid yet." });
  }

  if (bill.invoiceEmailedAt && !force) {
    const sentOn = new Date(bill.invoiceEmailedAt).toLocaleString("en-IN");
    return NextResponse.json({ ok: true, emailed: false, reason: "already-sent", message: `Invoice was already emailed on ${sentOn}.` });
  }

  // Legacy rows can predate the sequential-number trigger; assign one now so
  // the emailed invoice never falls back to a raw UUID.
  if (!bill.invoiceNumber) {
    await db.execute(sql`
      UPDATE service_bills
      SET invoice_number = next_document_number('service_invoice', 'LOOP-INV')
      WHERE id = ${billId} AND (invoice_number IS NULL OR invoice_number = '')
    `);
    [bill] = await db.select().from(serviceBills).where(eq(serviceBills.id, billId)).limit(1);
    if (!bill?.invoiceNumber) {
      return NextResponse.json({ ok: false, error: "Could not assign an invoice number. Run the invoice numbering migration." }, { status: 500 });
    }
  }

  const [booking] = bill.bookingId
    ? await db.select().from(bookings).where(eq(bookings.id, bill.bookingId)).limit(1)
    : [];

  let customerEmail = (bill.customerEmail || "").trim().toLowerCase();
  if (!customerEmail && booking?.userId) {
    const authUser = await adminGetUser(booking.userId);
    customerEmail = (authUser?.email || "").trim().toLowerCase();
  }
  if (!customerEmail || !isValidEmail(customerEmail)) {
    return NextResponse.json({ ok: true, emailed: false, reason: "no-email", message: "No customer email on the bill or its order." });
  }

  const customerAddress =
    (bill.customerAddress || "").trim() ||
    [booking?.location, booking?.pincode].filter(Boolean).join(" - ") ||
    null;
  const warrantyLabel =
    bill.warrantyLabel ||
    formatWarrantyLabel(bill.warrantyDurationValue == null ? null : Number(bill.warrantyDurationValue), bill.warrantyDurationUnit);

  const invoiceNumber = bill.invoiceNumber;
  const amount = Number(bill.amount || 0);
  const discount = Number(bill.discount || 0);
  const tax = Number(bill.tax || 0);
  const totalAmount = bill.totalAmount == null ? Math.max(amount - discount + tax, 0) : Number(bill.totalAmount);

  const pdf = createInvoicePdfBytes({
    id: bill.id,
    invoice_number: invoiceNumber,
    customer_name: bill.customerName,
    customer_phone: bill.customerPhone,
    customer_email: customerEmail,
    customer_address: customerAddress,
    booking_code: booking?.bookingCode ?? null,
    service_type: bill.serviceType,
    description: bill.description,
    amount,
    discount,
    tax,
    total_amount: totalAmount,
    payment_status: bill.paymentStatus,
    payment_mode: bill.paymentMode,
    notes: bill.notes,
    warranty_label: warrantyLabel,
    created_at: (bill.createdAt instanceof Date ? bill.createdAt : new Date(bill.createdAt)).toISOString(),
  });

  const emailResult = await sendInvoiceEmail({
    to: customerEmail,
    customerName: bill.customerName,
    invoiceNumber,
    bookingCode: booking?.bookingCode ?? null,
    serviceLabel: formatBookingServiceType(bill.serviceType),
    description: bill.description,
    amount,
    discount,
    tax,
    totalAmount,
    paymentStatus: bill.paymentStatus,
    paymentMode: bill.paymentMode,
    warrantyLabel,
    pdfBase64: Buffer.from(pdf, "binary").toString("base64"),
    pdfFilename: invoicePdfFilename({ id: bill.id, invoice_number: invoiceNumber }),
  });

  if (!emailResult.ok) {
    const errorMessage = "error" in emailResult ? emailResult.error : "Unable to send the invoice email.";
    return NextResponse.json({ ok: false, error: errorMessage }, { status: (emailResult as { status?: number }).status || 500 });
  }

  // Persist the resolved contact details so future sends and downloads reuse them.
  await db
    .update(serviceBills)
    .set({
      invoiceEmailedAt: new Date(),
      customerEmail: bill.customerEmail || customerEmail,
      customerAddress: bill.customerAddress || customerAddress,
    })
    .where(eq(serviceBills.id, billId));

  return NextResponse.json({ ok: true, emailed: true, to: customerEmail, invoiceNumber });
}
