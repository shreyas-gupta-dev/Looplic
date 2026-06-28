import { formatBookingServiceType } from "@/src/lib/bookings";
import { companyName, supportEmail, supportPhoneDisplay } from "@/src/lib/company";
import { siteConfig } from "@/src/lib/site";
import { getVisitingChargePolicy } from "@/src/lib/visiting-charge";

type InvoiceBill = {
  id: string;
  invoice_number: string | null;
  customer_name: string;
  customer_phone: string | null;
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

type BookingConfirmationPdf = {
  bookingCode?: string | null;
  customerName: string;
  customerPhone: string;
  serviceType: string;
  serviceLabel: string;
  price?: string | number | null;
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

function createInvoicePdfBytes(bill: InvoiceBill) {
  const invoiceNumber = bill.invoice_number || bill.id;
  const createdAt = bill.created_at ? new Date(bill.created_at).toLocaleString("en-IN") : new Date().toLocaleString("en-IN");
  const warrantyLabel = bill.warranty_label || "";
  const lines: string[] = [];

  addRect(lines, 0, 0, 595, 842, colors.page);
  addRect(lines, 36, 36, 523, 770, colors.white);
  addRect(lines, 36, 742, 523, 64, colors.brand);
  addText(lines, companyName, 58, 778, 22, colors.white, "F2");
  addText(lines, "SERVICE INVOICE", 58, 759, 10, colors.white, "F2");
  addText(lines, `Invoice: ${invoiceNumber}`, 320, 778, 8, colors.white, "F2");
  addText(lines, `Date: ${createdAt}`, 320, 759, 8, colors.white);

  addText(lines, "Bill To", 58, 706, 10, colors.slate900, "F2");
  addLine(lines, 58, 698, 246, 698, colors.slate200);
  addText(lines, bill.customer_name || "Customer", 58, 678, 14, colors.slate900, "F2");
  addText(lines, `Phone: ${bill.customer_phone || "-"}`, 58, 660, 10, colors.slate900);

  addText(lines, "Looplic Support", 350, 706, 10, colors.slate900, "F2");
  addLine(lines, 350, 698, 537, 698, colors.slate200);
  addText(lines, supportPhoneDisplay, 350, 678, 10, colors.slate900, "F2");
  addText(lines, supportEmail, 350, 660, 10, colors.slate900);

  addRect(lines, 58, 595, 479, 36, colors.slate100);
  addText(lines, "Service", 78, 609, 10, colors.slate900, "F2");
  addText(lines, "Description", 214, 609, 10, colors.slate900, "F2");
  addText(lines, "Amount", 464, 609, 10, colors.slate900, "F2");

  addText(lines, formatBookingServiceType(bill.service_type), 78, 564, 11, colors.slate900, "F2");
  addWrappedText(lines, bill.description || "Service work", 214, 564, 48, 9, colors.slate900, 11);
  addText(lines, money(bill.amount), 464, 564, 11, colors.slate900, "F2");
  addLine(lines, 58, 538, 537, 538);

  const totals = [
    ["Subtotal", money(bill.amount)],
    ["Discount", money(bill.discount)],
    ["Tax", money(bill.tax)],
  ];

  let totalY = 495;
  totals.forEach(([label, value]) => {
    addText(lines, label, 352, totalY, 10, colors.slate600);
    addText(lines, value, 464, totalY, 10, colors.slate900, "F2");
    totalY -= 24;
  });

  addRect(lines, 336, 395, 201, 48, colors.emerald);
  addText(lines, "Total", 356, 415, 12, colors.white, "F2");
  addText(lines, money(bill.total_amount), 442, 415, 14, colors.white, "F2");

  addText(lines, "Payment", 58, 428, 10, colors.slate900, "F2");
  addLine(lines, 58, 420, 246, 420, colors.slate200);
  addText(lines, `Status: ${bill.payment_status}`, 58, 398, 11, colors.slate900, "F2");
  addText(lines, `Mode: ${bill.payment_mode || "-"}`, 58, 380, 10, colors.slate900);

  if (warrantyLabel) {
    addRect(lines, 58, 340, 188, 52, colors.emerald50);
    addStrokeRect(lines, 58, 340, 188, 52, colors.slate200, 1);
    addText(lines, "Warranty", 78, 372, 9, colors.emerald, "F2");
    addText(lines, warrantyLabel, 78, 354, 11, colors.slate900, "F2");
  }

  if (bill.notes) {
    addText(lines, "NOTES", 58, warrantyLabel ? 314 : 345, 9, colors.slate500, "F2");
    addText(lines, bill.notes, 58, warrantyLabel ? 296 : 325, 10, colors.slate600);
  }

  addLine(lines, 58, 170, 537, 170);
  addText(lines, "Important customer terms", 58, 148, 10, colors.slate900, "F2");
  let termsY = 132;
  termsY = addWrappedText(lines, "1. Do not deal directly with any technician outside Looplic. If you cancel, pay, or repair outside Looplic, Looplic will not be responsible for service issues, warranty, guarantee, spare parts, damage, data concerns, payments, or follow-up support.", 58, termsY, 116, 8, colors.slate500, 10);
  termsY = addWrappedText(lines, "2. If a technician offers a lower amount, asks you to cancel the Looplic order, or requests direct payment, share valid proof with Looplic. After verification, you may be eligible for full free-of-cost service for that reported order.", 58, termsY - 4, 116, 8, colors.slate500, 10);
  const invoiceVisitingChargePolicy = getVisitingChargePolicy(bill.service_type);
  if (invoiceVisitingChargePolicy) {
    termsY = addWrappedText(lines, `3. ${invoiceVisitingChargePolicy}`, 58, termsY - 4, 116, 8, colors.slate500, 10);
  }
  addText(lines, `Full terms: ${new URL("/terms-and-conditions#customer-terms", siteConfig.url).toString()}`, 58, termsY - 4, 8, colors.slate500);
  addText(lines, "Thank you for choosing Looplic.", 58, 54, 10, colors.slate900, "F2");
  addText(lines, "This is a computer-generated invoice for your service order.", 58, 40, 8, colors.slate500);

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

function createBookingConfirmationPdfBytes(booking: BookingConfirmationPdf) {
  const confirmationNumber = booking.bookingCode || `LOOPLIC-${Date.now()}`;
  const createdAt = new Date().toLocaleString("en-IN");
  const device = [booking.brand, booking.series, booking.model].filter(Boolean).join(" ") || "-";
  const address = [booking.address, booking.city, booking.pincode].filter(Boolean).join(", ") || "-";
  const visitingChargePolicy = getVisitingChargePolicy(booking.serviceType);
  const lines: string[] = [];

  addRect(lines, 0, 0, 595, 842, colors.page);
  addRect(lines, 36, 36, 523, 770, colors.white);
  addRect(lines, 36, 742, 523, 64, colors.brand);
  addText(lines, companyName, 58, 778, 22, colors.white, "F2");
  addText(lines, "BOOKING CONFIRMATION INVOICE", 58, 759, 10, colors.white, "F2");
  addText(lines, `Booking: ${confirmationNumber}`, 320, 778, 8, colors.white, "F2");
  addText(lines, `Date: ${createdAt}`, 320, 759, 8, colors.white);

  addText(lines, "Customer", 58, 706, 10, colors.slate900, "F2");
  addLine(lines, 58, 698, 246, 698, colors.slate200);
  addText(lines, booking.customerName || "Customer", 58, 678, 14, colors.slate900, "F2");
  addText(lines, `Phone: ${booking.customerPhone || "-"}`, 58, 660, 10, colors.slate900);

  addText(lines, "Looplic Support", 350, 706, 10, colors.slate900, "F2");
  addLine(lines, 350, 698, 537, 698, colors.slate200);
  addText(lines, supportPhoneDisplay, 350, 678, 10, colors.slate900, "F2");
  addText(lines, supportEmail, 350, 660, 10, colors.slate900);

  addRect(lines, 58, 590, 479, 40, colors.slate100);
  addText(lines, "Booking details", 78, 606, 11, colors.slate900, "F2");

  const details = [
    ["Service", booking.serviceLabel || formatBookingServiceType(booking.serviceType)],
    ["Service type", formatBookingServiceType(booking.serviceType)],
    ["Device", device],
    ["Price / estimate", booking.price ? money(booking.price) : "To be confirmed"],
    ["Scheduled date", booking.scheduledDate || "-"],
    ["Preferred time", booking.timeSlot || "-"],
    ["Address", address],
    ["Visiting charge", visitingChargePolicy || "-"],
    ["Notes", booking.notes || "-"],
  ];

  let detailsY = 558;
  details.forEach(([label, value]) => {
    addText(lines, label, 78, detailsY, 9, colors.slate600, "F2");
    detailsY = addWrappedText(lines, value, 214, detailsY, 62, 9, colors.slate900, 11) - 6;
  });

  addRect(lines, 58, 228, 479, 48, colors.emerald50);
  addText(lines, "Next step", 78, 254, 10, colors.slate900, "F2");
  addText(lines, "Looplic support or the assigned technician will confirm scope, quote, and visit flow before work begins.", 78, 238, 8, colors.slate600);

  addCustomerTermsNoticeCard(lines, 204);
  addText(lines, "Thank you for choosing Looplic.", 58, 54, 10, colors.slate900, "F2");
  addText(lines, "This is a computer-generated booking confirmation.", 58, 40, 8, colors.slate500);

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

export function createPickupAgreementPdfBytes(agreement: PickupAgreementPdf) {
  const createdAt = new Date().toLocaleString("en-IN");
  const lines: string[] = [];

  addRect(lines, 0, 0, 595, 842, colors.page);
  addRect(lines, 36, 36, 523, 770, colors.white);
  addRect(lines, 36, 742, 523, 64, colors.brand);
  addText(lines, companyName, 58, 778, 22, colors.white, "F2");
  addText(lines, "PICKUP AGREEMENT", 58, 759, 10, colors.white, "F2");
  addText(lines, `Agreement: ${agreement.agreementNumber}`, 320, 778, 8, colors.white, "F2");
  addText(lines, `Date: ${createdAt}`, 320, 759, 8, colors.white);

  addText(lines, "Customer", 58, 706, 10, colors.slate900, "F2");
  addLine(lines, 58, 698, 246, 698, colors.slate200);
  addText(lines, agreement.customerName || "Customer", 58, 678, 14, colors.slate900, "F2");
  addText(lines, `Phone: ${agreement.customerPhone || "-"}`, 58, 660, 10, colors.slate900);
  addText(lines, `Email: ${agreement.customerEmail || "-"}`, 58, 644, 9, colors.slate600);

  addText(lines, "Looplic Pickup", 350, 706, 10, colors.slate900, "F2");
  addLine(lines, 350, 698, 537, 698, colors.slate200);
  addText(lines, supportPhoneDisplay, 350, 678, 10, colors.slate900, "F2");
  addText(lines, supportEmail, 350, 660, 10, colors.slate900);
  addText(lines, `Technician: ${agreement.technicianEmail || "-"}`, 350, 644, 8, colors.slate600);

  addRect(lines, 58, 590, 479, 40, colors.slate100);
  addText(lines, "Pickup and drop timeline", 78, 606, 11, colors.slate900, "F2");
  addText(lines, "Pickup", 78, 562, 9, colors.slate600, "F2");
  addWrappedText(lines, agreement.pickupDateTime || "-", 214, 562, 58, 10, colors.slate900, 12);
  addText(lines, "Expected drop", 78, 536, 9, colors.slate600, "F2");
  addWrappedText(lines, agreement.dropDateTime || "-", 214, 536, 58, 10, colors.slate900, 12);
  addText(lines, "Pickup address", 78, 510, 9, colors.slate600, "F2");
  addWrappedText(lines, agreement.pickupAddress || "-", 214, 510, 58, 9, colors.slate900, 11);
  addText(lines, "Handover person", 78, 470, 9, colors.slate600, "F2");
  addWrappedText(lines, agreement.pickupPerson || "-", 214, 470, 58, 9, colors.slate900, 11);

  addRect(lines, 58, 398, 479, 40, colors.slate100);
  addText(lines, "Device and inspection details", 78, 414, 11, colors.slate900, "F2");
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

  let detailsY = 370;
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

export function downloadInvoicePdf(bill: InvoiceBill) {
  const invoiceNumber = bill.invoice_number || bill.id;
  const blob = new Blob([createInvoicePdfBytes(bill)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${invoiceNumber}.pdf`;
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
