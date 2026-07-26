import { NextResponse } from "next/server";
import { and, eq, inArray, sql } from "drizzle-orm";

import { adminGetUser, getServerSession } from "@/src/lib/auth/cognito-server";
import { db } from "@/src/lib/db";
import { buybackBookings, userRoles } from "@/src/lib/db/schema";
import { sendInvoiceEmail } from "@/src/lib/email/resend";
import { createInvoicePdfBytes } from "@/src/lib/invoice-pdf";

export const runtime = "nodejs";

const ALLOWED_ROLES = ["admin", "operation"] as const;

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Emails a payment receipt PDF for a buyback order once it is marked paid.
// The payout goes to the customer, so the document is a receipt (LOOP-RCT-…),
// not a tax invoice. Sends once per order unless `force` is passed.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const bookingId = String(body?.bookingId ?? "").trim();
  const force = body?.force === true;

  if (!bookingId) {
    return NextResponse.json({ ok: false, error: "bookingId is required." }, { status: 400 });
  }

  const session = await getServerSession();
  if (!session.user) {
    return NextResponse.json({ ok: false, error: "Sign in to email receipts." }, { status: 401 });
  }

  const roleRows = await db
    .select()
    .from(userRoles)
    .where(and(eq(userRoles.userId, session.user.id), inArray(userRoles.role, [...ALLOWED_ROLES])))
    .limit(1);
  if (roleRows.length === 0) {
    return NextResponse.json({ ok: false, error: "Staff access is required." }, { status: 403 });
  }

  let [order] = await db.select().from(buybackBookings).where(eq(buybackBookings.id, bookingId)).limit(1);
  if (!order) {
    return NextResponse.json({ ok: false, error: "Buyback order was not found." }, { status: 404 });
  }

  if (order.status !== "paid") {
    return NextResponse.json({ ok: true, emailed: false, reason: "not-paid", message: "Order is not marked paid yet." });
  }

  if (order.receiptEmailedAt && !force) {
    const sentOn = new Date(order.receiptEmailedAt).toLocaleString("en-IN");
    return NextResponse.json({ ok: true, emailed: false, reason: "already-sent", message: `Receipt was already emailed on ${sentOn}.` });
  }

  if (!order.receiptNumber) {
    await db.execute(sql`
      UPDATE buyback_bookings
      SET receipt_number = next_document_number('buyback_receipt', 'LOOP-RCT')
      WHERE id = ${bookingId} AND receipt_number IS NULL
    `);
    [order] = await db.select().from(buybackBookings).where(eq(buybackBookings.id, bookingId)).limit(1);
    if (!order?.receiptNumber) {
      return NextResponse.json({ ok: false, error: "Could not assign a receipt number. Run the invoice numbering migration." }, { status: 500 });
    }
  }

  let customerEmail = "";
  if (order.userId) {
    const authUser = await adminGetUser(order.userId);
    customerEmail = (authUser?.email || "").trim().toLowerCase();
  }
  if (!customerEmail || !isValidEmail(customerEmail)) {
    return NextResponse.json({ ok: true, emailed: false, reason: "no-email", message: "No customer email on this order (guest booking)." });
  }

  const deviceLabel = `${order.brandName} ${order.modelName}${order.variantLabel ? ` (${order.variantLabel})` : ""}`;
  const amount = Number(order.quotedAmount || 0);
  const receiptNumber = order.receiptNumber;

  const pdf = createInvoicePdfBytes({
    id: order.id,
    invoice_number: receiptNumber,
    document_title: "PAYMENT RECEIPT",
    customer_name: order.customerName,
    customer_phone: order.phone,
    customer_email: customerEmail,
    customer_address: order.address,
    booking_code: order.bookingCode,
    service_type: order.serviceType,
    description: `Device buyback - ${deviceLabel}. Amount paid to customer.`,
    amount,
    discount: 0,
    tax: 0,
    total_amount: amount,
    payment_status: "paid",
    payment_mode: null,
    notes: order.quoteBreakdown,
    created_at: new Date().toISOString(),
  });

  const emailResult = await sendInvoiceEmail({
    to: customerEmail,
    customerName: order.customerName,
    invoiceNumber: receiptNumber,
    documentLabel: "payment receipt",
    bookingCode: order.bookingCode,
    serviceLabel: "Device Buyback",
    description: deviceLabel,
    amount,
    discount: 0,
    tax: 0,
    totalAmount: amount,
    paymentStatus: "paid",
    pdfBase64: Buffer.from(pdf, "binary").toString("base64"),
    pdfFilename: `${receiptNumber}.pdf`,
  });

  if (!emailResult.ok) {
    const errorMessage = "error" in emailResult ? emailResult.error : "Unable to send the receipt email.";
    return NextResponse.json({ ok: false, error: errorMessage }, { status: (emailResult as { status?: number }).status || 500 });
  }

  await db.update(buybackBookings).set({ receiptEmailedAt: new Date() }).where(eq(buybackBookings.id, bookingId));

  return NextResponse.json({ ok: true, emailed: true, to: customerEmail, receiptNumber });
}
