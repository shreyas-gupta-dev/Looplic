import { formatBookingServiceType } from "@/src/lib/bookings";
import {
  companyGstin,
  companyName,
  companyRegisteredAddress,
  companyWebsite,
  supportEmail,
  supportPhoneDisplay,
} from "@/src/lib/company";
import { siteConfig } from "@/src/lib/site";
import { getVisitingChargePolicy } from "@/src/lib/visiting-charge";

export type InvoiceBill = {
  id: string;
  invoice_number: string | null;
  // Overrides the default "TAX INVOICE"/"INVOICE" heading, e.g. buyback
  // payment receipts pass "PAYMENT RECEIPT".
  document_title?: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email?: string | null;
  customer_address?: string | null;
  booking_code?: string | null;
  service_type: string;
  description: string | null;
  amount: number;
  discount: number;
  tax: number;
  total_amount: number;
  payment_status: string;
  payment_mode: string | null;
  notes?: string | null;
  warranty_duration_value?: number | null;
  warranty_duration_unit?: string | null;
  warranty_label?: string | null;
  created_at: string;
};

export type BookingConfirmationPdf = {
  bookingCode?: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  serviceType: string;
  serviceLabel: string;
  price?: string | number | null;
  priceLabel?: string;
  documentTitle?: string;
  brand?: string | null;
  series?: string | null;
  model?: string | null;
  scheduledDate?: string | null;
  timeSlot?: string | null;
  address?: string | null;
  city?: string | null;
  pincode?: string | null;
  notes?: string | null;
};

export type PickupAgreementPdf = {
  agreementNumber: string;
  bookingCode?: string | null;
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  serviceLabel: string;
  deviceLabel: string;
  issue: string;
  deviceCondition: string;
  accessories: string;
  estimatedQuote?: string | number | null;
  pickupDateTime: string;
  dropDateTime: string;
  pickupAddress: string;
  pickupPerson: string;
  technicianEmail: string;
  notes?: string | null;
};

function sanitizePdfText(value: string | number | null | undefined) {
  return String(value ?? "")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function money(value: number | string | null | undefined) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
}

const colors = {
  page: "0.972 0.980 0.988",
  white: "1 1 1",
  brand: "0 0.588 1",
  emerald: "0.063 0.725 0.506",
  slate900: "0.059 0.090 0.165",
  slate600: "0.278 0.333 0.412",
  slate500: "0.392 0.455 0.545",
  slate200: "0.886 0.910 0.941",
  slate100: "0.945 0.961 0.976",
  blue50: "0.937 0.965 1",
  emerald50: "0.925 0.992 0.961",
};

function addText(lines: string[], text: string, x: number, y: number, size = 10, color = colors.slate900, font = "F1") {
  lines.push(`BT /${font} ${size} Tf ${color} rg ${x} ${y} Td (${sanitizePdfText(text)}) Tj ET`);
}

// Right-aligns text at rightX using an approximate Helvetica advance width.
// Widths lean slightly wide so right-aligned text never overshoots rightX.
function estimateTextWidth(text: string, size: number, font: string) {
  let em = 0;
  for (const char of text) {
    if (/[iljtfI.,:;'"()\[\]|! -]/.test(char)) em += 0.34;
    else if (/[mwMW@]/.test(char)) em += 0.9;
    else if (/[0-9]/.test(char)) em += 0.58;
    else if (/[A-Z]/.test(char)) em += 0.72;
    else em += 0.56;
  }
  return em * size * (font === "F2" ? 1.05 : 1);
}

function addTextRight(lines: string[], text: string, rightX: number, y: number, size = 10, color = colors.slate900, font = "F1") {
  const clean = String(text ?? "").replace(/[^\x20-\x7E]/g, "");
  const x = rightX - estimateTextWidth(clean, size, font);
  addText(lines, clean, x, y, size, color, font);
}

function addRect(lines: string[], x: number, y: number, width: number, height: number, color: string) {
  lines.push(`${color} rg ${x} ${y} ${width} ${height} re f`);
}

function addStrokeRect(lines: string[], x: number, y: number, width: number, height: number, color = colors.slate200, lineWidth = 1) {
  lines.push(`${color} RG ${lineWidth} w ${x} ${y} ${width} ${height} re S`);
}

function addLine(lines: string[], x1: number, y1: number, x2: number, y2: number, color = colors.slate200, width = 1) {
  lines.push(`${color} RG ${width} w ${x1} ${y1} m ${x2} ${y2} l S`);
}

function addWrappedText(lines: string[], text: string, x: number, y: number, maxChars: number, size = 9, color = colors.slate500, lineHeight = 12) {
  const words = text.split(" ");
  const rows: string[] = [];
  let current = "";

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      rows.push(current);
      current = word;
    } else {
      current = next;
    }
  });

  if (current) {
    rows.push(current);
  }

  rows.forEach((row, index) => addText(lines, row, x, y - index * lineHeight, size, color));
  return y - rows.length * lineHeight;
}

// Shared page frame + branded company header. Every Looplic document carries
// the full company identity: name, registered address, contacts, website, and
// (when configured) GSTIN. Returns nothing; content should start below y=706.
function addCompanyHeader(lines: string[], documentTitle: string, headerRight: Array<[string, string]> = []) {
  addRect(lines, 0, 0, 595, 842, colors.page);
  addRect(lines, 36, 36, 523, 770, colors.white);
  addRect(lines, 36, 716, 523, 90, colors.brand);
  addText(lines, companyName, 58, 770, 24, colors.white, "F2");
  addText(lines, companyRegisteredAddress, 58, 753, 8, colors.white);
  addText(lines, `Phone: ${supportPhoneDisplay}  |  ${supportEmail}  |  ${companyWebsite}`, 58, 740, 8, colors.white);
  if (companyGstin) {
    addText(lines, `GSTIN: ${companyGstin}`, 58, 727, 8, colors.white, "F2");
  }

  addTextRight(lines, documentTitle, 537, 772, 13, colors.white, "F2");
  let rightY = 755;
  headerRight.forEach(([label, value]) => {
    addTextRight(lines, `${label}: ${value}`, 537, rightY, 8, colors.white);
    rightY -= 13;
  });
}

// Four-column meta strip under the header (labels + bold values).
function addMetaStrip(lines: string[], entries: Array<[string, string]>) {
  addRect(lines, 58, 664, 479, 36, colors.slate100);
  const columnX = [74, 195, 316, 437];
  entries.slice(0, 4).forEach(([label, value], index) => {
    addText(lines, label.toUpperCase(), columnX[index], 686, 7, colors.slate500, "F2");
    addText(lines, value, columnX[index], 671, 9, colors.slate900, "F2");
  });
}

// Two-column Bill To / From block. Returns the lowest y it used.
function addPartiesBlock(
  lines: string[],
  billTo: { name: string; phone?: string | null; email?: string | null; address?: string | null },
) {
  addText(lines, "BILL TO", 58, 640, 8, colors.slate500, "F2");
  addText(lines, billTo.name || "Customer", 58, 622, 12, colors.slate900, "F2");
  let leftY = 607;
  if (billTo.phone) {
    addText(lines, `Phone: ${billTo.phone}`, 58, leftY, 9, colors.slate900);
    leftY -= 13;
  }
  if (billTo.email) {
    addText(lines, billTo.email, 58, leftY, 9, colors.slate900);
    leftY -= 13;
  }
  if (billTo.address) {
    leftY = addWrappedText(lines, billTo.address, 58, leftY, 52, 9, colors.slate600, 12);
  }

  addText(lines, "FROM", 350, 640, 8, colors.slate500, "F2");
  addText(lines, companyName, 350, 622, 12, colors.slate900, "F2");
  addText(lines, companyRegisteredAddress, 350, 607, 9, colors.slate600);
  addText(lines, `Phone: ${supportPhoneDisplay}`, 350, 594, 9, colors.slate900);
  addText(lines, supportEmail, 350, 581, 9, colors.slate900);
  addText(lines, companyWebsite, 350, 568, 9, colors.slate900);
  let rightY = 555;
  if (companyGstin) {
    addText(lines, `GSTIN: ${companyGstin}`, 350, rightY, 9, colors.slate900, "F2");
    rightY -= 13;
  }

  return Math.min(leftY, rightY);
}

function addCustomerTermsNoticeCard(lines: string[], topY: number) {
  const cardX = 58;
  const cardY = topY - 136;
  const cardWidth = 479;
  const cardHeight = 136;
  const contentX = 78;
  const termsUrl = new URL("/terms-and-conditions#customer-terms", siteConfig.url).toString();

  addRect(lines, cardX, cardY, cardWidth, cardHeight, colors.blue50);
  addRect(lines, cardX, cardY, 6, cardHeight, colors.brand);
  addStrokeRect(lines, cardX, cardY, cardWidth, cardHeight, colors.slate200, 1);
  addText(lines, "IMPORTANT CUSTOMER TERMS", contentX, topY - 24, 10, colors.brand, "F2");
  addText(lines, "Please read before technician visit or repair approval.", contentX, topY - 40, 8, colors.slate600);

  let termsY = topY - 60;
  termsY = addWrappedText(lines, "1. Do not deal directly with any technician outside Looplic. If you cancel, pay, or repair outside Looplic, Looplic will not be responsible for service issues, warranty, guarantee, spare parts, damage, data concerns, payments, or follow-up support.", contentX, termsY, 104, 8, colors.slate900, 10);
  termsY = addWrappedText(lines, "2. If a technician offers a lower amount, asks you to cancel the Looplic order, or requests direct payment, share valid proof with Looplic. After verification, you may be eligible for full free-of-cost service for that reported order.", contentX, termsY - 4, 104, 8, colors.slate900, 10);
  addText(lines, `Full terms: ${termsUrl}`, contentX, Math.max(cardY + 12, termsY - 4), 8, colors.slate600, "F2");
}

// Wraps the accumulated content stream into a complete single-page PDF file.
function finishPdf(lines: string[]) {
  const stream = lines.join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return pdf;
}

function formatPaymentSummary(status: string, mode?: string | null) {
  const cleanStatus = (status || "unpaid").toUpperCase();
  return mode ? `${cleanStatus} - ${mode}` : cleanStatus;
}

export function createInvoicePdfBytes(bill: InvoiceBill) {
  const invoiceNumber = bill.invoice_number || "Pending assignment";
  const invoiceDate = bill.created_at ? new Date(bill.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const warrantyLabel = bill.warranty_label || "";
  const documentTitle = bill.document_title || (companyGstin ? "TAX INVOICE" : "INVOICE");
  const refWord = documentTitle.toUpperCase().includes("RECEIPT") ? "Receipt" : "Invoice";
  const lines: string[] = [];

  addCompanyHeader(lines, documentTitle, [[refWord, invoiceNumber]]);
  addMetaStrip(lines, [
    [`${refWord} No`, invoiceNumber],
    [`${refWord} Date`, invoiceDate],
    ["Order Code", bill.booking_code || "-"],
    ["Payment", formatPaymentSummary(bill.payment_status, bill.payment_mode)],
  ]);

  addPartiesBlock(lines, {
    name: bill.customer_name,
    phone: bill.customer_phone,
    email: bill.customer_email,
    address: bill.customer_address,
  });

  addRect(lines, 58, 500, 479, 28, colors.slate100);
  addText(lines, "#", 70, 510, 9, colors.slate900, "F2");
  addText(lines, "DESCRIPTION", 100, 510, 9, colors.slate900, "F2");
  addTextRight(lines, "AMOUNT (INR)", 521, 510, 9, colors.slate900, "F2");

  addText(lines, "1", 70, 478, 10, colors.slate900);
  addText(lines, formatBookingServiceType(bill.service_type), 100, 478, 11, colors.slate900, "F2");
  addWrappedText(lines, bill.description || "Service work", 100, 462, 62, 9, colors.slate600, 11);
  addTextRight(lines, money(bill.amount), 521, 478, 11, colors.slate900, "F2");
  addLine(lines, 58, 432, 537, 432);

  const totals: Array<[string, string]> = [
    ["Subtotal", money(bill.amount)],
    ["Discount", `- ${money(bill.discount)}`],
    ["Tax", money(bill.tax)],
  ];
  let totalY = 410;
  totals.forEach(([label, value]) => {
    addText(lines, label, 352, totalY, 10, colors.slate600);
    addTextRight(lines, value, 521, totalY, 10, colors.slate900, "F2");
    totalY -= 18;
  });
  addRect(lines, 330, 320, 207, 40, colors.emerald);
  addText(lines, "GRAND TOTAL", 344, 335, 10, colors.white, "F2");
  addTextRight(lines, money(bill.total_amount), 521, 333, 13, colors.white, "F2");

  addText(lines, "PAYMENT", 58, 410, 8, colors.slate500, "F2");
  addText(lines, (bill.payment_status || "unpaid").toUpperCase(), 58, 393, 11, colors.slate900, "F2");
  addText(lines, `Mode: ${bill.payment_mode || "-"}`, 58, 378, 9, colors.slate600);

  if (warrantyLabel) {
    addRect(lines, 58, 320, 200, 44, colors.emerald50);
    addStrokeRect(lines, 58, 320, 200, 44, colors.slate200, 1);
    addText(lines, "WARRANTY", 70, 347, 8, colors.emerald, "F2");
    addText(lines, warrantyLabel, 70, 330, 10, colors.slate900, "F2");
  }

  if (bill.notes) {
    addText(lines, "NOTES", 58, 292, 8, colors.slate500, "F2");
    addWrappedText(lines, bill.notes, 58, 277, 110, 9, colors.slate600, 11);
  }

  addLine(lines, 58, 226, 537, 226);
  addText(lines, "Important customer terms", 58, 208, 9, colors.slate900, "F2");
  let termsY = 193;
  termsY = addWrappedText(lines, "1. Do not deal directly with any technician outside Looplic. If you cancel, pay, or repair outside Looplic, Looplic will not be responsible for service issues, warranty, guarantee, spare parts, damage, data concerns, payments, or follow-up support.", 58, termsY, 116, 8, colors.slate500, 10);
  termsY = addWrappedText(lines, "2. If a technician offers a lower amount, asks you to cancel the Looplic order, or requests direct payment, share valid proof with Looplic. After verification, you may be eligible for full free-of-cost service for that reported order.", 58, termsY - 4, 116, 8, colors.slate500, 10);
  const invoiceVisitingChargePolicy = getVisitingChargePolicy(bill.service_type);
  if (invoiceVisitingChargePolicy) {
    termsY = addWrappedText(lines, `3. ${invoiceVisitingChargePolicy}`, 58, termsY - 4, 116, 8, colors.slate500, 10);
  }
  addText(lines, `Full terms: ${new URL("/terms-and-conditions#customer-terms", siteConfig.url).toString()}`, 58, termsY - 4, 8, colors.slate500);
  addText(lines, "Thank you for choosing Looplic.", 58, 58, 10, colors.slate900, "F2");
  addText(lines, "This is a computer-generated invoice and does not require a signature.", 58, 44, 8, colors.slate500);

  return finishPdf(lines);
}

export function createBookingConfirmationPdfBytes(booking: BookingConfirmationPdf) {
  const confirmationNumber = booking.bookingCode || `LOOPLIC-${Date.now()}`;
  const createdAt = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const device = [booking.brand, booking.series, booking.model].filter(Boolean).join(" ") || "-";
  const address = [booking.address, booking.city, booking.pincode].filter(Boolean).join(", ") || "-";
  const visitingChargePolicy = getVisitingChargePolicy(booking.serviceType);
  const documentTitle = booking.documentTitle || "BOOKING CONFIRMATION";
  const lines: string[] = [];

  addCompanyHeader(lines, documentTitle, [["Booking", confirmationNumber]]);
  addMetaStrip(lines, [
    ["Booking Code", confirmationNumber],
    ["Booking Date", createdAt],
    ["Service Type", formatBookingServiceType(booking.serviceType)],
    ["Status", "RECEIVED"],
  ]);

  const partiesBottom = addPartiesBlock(lines, {
    name: booking.customerName,
    phone: booking.customerPhone,
    email: booking.customerEmail,
    address,
  });

  const tableTop = Math.min(528, partiesBottom - 12);
  addRect(lines, 58, tableTop - 28, 479, 28, colors.slate100);
  addText(lines, "BOOKING DETAILS", 70, tableTop - 18, 9, colors.slate900, "F2");

  const details = [
    ["Service", booking.serviceLabel || formatBookingServiceType(booking.serviceType)],
    ["Device", device],
    [booking.priceLabel || "Price / estimate", booking.price ? money(booking.price) : "To be confirmed"],
    ["Scheduled date", booking.scheduledDate || "-"],
    ["Preferred time", booking.timeSlot || "-"],
    ["Service address", address],
    ["Visiting charge", visitingChargePolicy || "-"],
    ["Notes", booking.notes || "-"],
  ];

  let detailsY = tableTop - 48;
  details.forEach(([label, value]) => {
    addText(lines, label, 70, detailsY, 9, colors.slate600, "F2");
    detailsY = addWrappedText(lines, value, 214, detailsY, 62, 9, colors.slate900, 11) - 7;
  });

  addRect(lines, 58, 228, 479, 48, colors.emerald50);
  addText(lines, "Next step", 78, 254, 10, colors.slate900, "F2");
  addText(lines, "Looplic support or the assigned technician will confirm scope, quote, and visit flow before work begins.", 78, 238, 8, colors.slate600);

  addCustomerTermsNoticeCard(lines, 204);
  addText(lines, "Thank you for choosing Looplic.", 58, 54, 10, colors.slate900, "F2");
  addText(lines, "This is a computer-generated booking confirmation.", 58, 40, 8, colors.slate500);

  return finishPdf(lines);
}

export function createPickupAgreementPdfBytes(agreement: PickupAgreementPdf) {
  const createdAt = new Date().toLocaleString("en-IN");
  const lines: string[] = [];

  addCompanyHeader(lines, "PICKUP AGREEMENT", [
    ["Agreement", agreement.agreementNumber],
    ["Date", createdAt],
  ]);

  addText(lines, "Customer", 58, 690, 10, colors.slate900, "F2");
  addLine(lines, 58, 682, 246, 682, colors.slate200);
  addText(lines, agreement.customerName || "Customer", 58, 662, 14, colors.slate900, "F2");
  addText(lines, `Phone: ${agreement.customerPhone || "-"}`, 58, 644, 10, colors.slate900);
  addText(lines, `Email: ${agreement.customerEmail || "-"}`, 58, 628, 9, colors.slate600);

  addText(lines, "Looplic Pickup", 350, 690, 10, colors.slate900, "F2");
  addLine(lines, 350, 682, 537, 682, colors.slate200);
  addText(lines, supportPhoneDisplay, 350, 662, 10, colors.slate900, "F2");
  addText(lines, supportEmail, 350, 644, 10, colors.slate900);
  addText(lines, `Technician: ${agreement.technicianEmail || "-"}`, 350, 628, 8, colors.slate600);

  addRect(lines, 58, 574, 479, 40, colors.slate100);
  addText(lines, "Pickup and drop timeline", 78, 590, 11, colors.slate900, "F2");
  addText(lines, "Pickup", 78, 546, 9, colors.slate600, "F2");
  addWrappedText(lines, agreement.pickupDateTime || "-", 214, 546, 58, 10, colors.slate900, 12);
  addText(lines, "Expected drop", 78, 520, 9, colors.slate600, "F2");
  addWrappedText(lines, agreement.dropDateTime || "-", 214, 520, 58, 10, colors.slate900, 12);
  addText(lines, "Pickup address", 78, 494, 9, colors.slate600, "F2");
  addWrappedText(lines, agreement.pickupAddress || "-", 214, 494, 58, 9, colors.slate900, 11);
  addText(lines, "Handover person", 78, 454, 9, colors.slate600, "F2");
  addWrappedText(lines, agreement.pickupPerson || "-", 214, 454, 58, 9, colors.slate900, 11);

  addRect(lines, 58, 382, 479, 40, colors.slate100);
  addText(lines, "Device and inspection details", 78, 398, 11, colors.slate900, "F2");
  const details = [
    ["Booking", agreement.bookingCode || "-"],
    ["Service", agreement.serviceLabel || "-"],
    ["Device", agreement.deviceLabel || "-"],
    ["Reported issue", agreement.issue || "-"],
    ["Device condition", agreement.deviceCondition || "-"],
    ["Accessories", agreement.accessories || "-"],
    ["Estimated quote", agreement.estimatedQuote ? money(agreement.estimatedQuote) : "To be confirmed"],
    ["Notes", agreement.notes || "-"],
  ];

  let detailsY = 354;
  details.forEach(([label, value]) => {
    addText(lines, label, 78, detailsY, 8, colors.slate600, "F2");
    detailsY = addWrappedText(lines, value, 214, detailsY, 62, 8, colors.slate900, 10) - 4;
  });

  addRect(lines, 58, 116, 479, 58, colors.emerald50);
  addStrokeRect(lines, 58, 116, 479, 58, colors.slate200, 1);
  addText(lines, "Customer acknowledgement", 78, 148, 10, colors.slate900, "F2");
  addText(lines, "Device pickup, issue, accessories, pickup timing, and expected drop timing have been recorded by Looplic.", 78, 132, 8, colors.slate600);

  addLine(lines, 58, 90, 242, 90, colors.slate200);
  addText(lines, "Customer signature", 58, 74, 8, colors.slate500);
  addLine(lines, 350, 90, 537, 90, colors.slate200);
  addText(lines, "Technician signature", 350, 74, 8, colors.slate500);
  addText(lines, "This is a computer-generated pickup agreement. Keep this document as pickup proof.", 58, 46, 8, colors.slate500);

  return finishPdf(lines);
}

export function invoicePdfFilename(bill: Pick<InvoiceBill, "id" | "invoice_number">) {
  return `${bill.invoice_number || `invoice-${bill.id.slice(0, 8)}`}.pdf`;
}

export function downloadInvoicePdf(bill: InvoiceBill) {
  const blob = new Blob([createInvoicePdfBytes(bill)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = invoicePdfFilename(bill);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function downloadBookingConfirmationPdf(booking: BookingConfirmationPdf) {
  const confirmationNumber = booking.bookingCode || `looplic-booking-${Date.now()}`;
  const blob = new Blob([createBookingConfirmationPdfBytes(booking)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${confirmationNumber}-booking-confirmation-invoice.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
