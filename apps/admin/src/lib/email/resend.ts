import type { LeadPayload } from "@/src/lib/leads/types";
import { siteConfig } from "@/src/lib/site";
import { getVisitingChargePolicy } from "@/src/lib/visiting-charge";

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_LEAD_TO_EMAIL = "touheed@looplic.com";
const DEFAULT_FROM_EMAIL = "Looplic <touheed@looplic.com>";
const LOGO_URL = new URL("/looplic-email-logo-transparent.png", siteConfig.url).toString();
const TERMS_URL = new URL("/terms-and-conditions#customer-terms", siteConfig.url).toString();
const CUSTOMER_DIRECT_DEAL_WARNING =
  "Do not deal directly with any technician outside Looplic. If you cancel, pay, or repair outside Looplic, Looplic will not be responsible for service issues, warranty, guarantee, spare parts, damage, data concerns, payments, or follow-up support.";
const CUSTOMER_DIRECT_PITCH_PROOF =
  "If a technician offers a lower amount, asks you to cancel the Looplic order, or requests direct payment, share valid proof with Looplic. After verification, you may be eligible for full free-of-cost service for that reported order.";

type ResendEmailInput = {
  to: string;
  from: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string;
  }>;
};

export type PickupAgreementEmailInput = {
  to: string;
  customerName: string;
  bookingCode?: string | null;
  customerPhone?: string | null;
  serviceLabel: string;
  deviceLabel: string;
  issue: string;
  deviceCondition: string;
  accessories: string;
  pickupDateTime: string;
  dropDateTime: string;
  pickupAddress: string;
  pickupPerson: string;
  technicianEmail: string;
  estimatedQuote?: string | number | null;
  notes?: string | null;
  pdfBase64: string;
  pdfFilename: string;
};

function asText(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatMoney(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  if (typeof value === "number") {
    return `Rs. ${value}`;
  }

  return value.startsWith("Rs.") ? value : value;
}

function buildRows(payload: LeadPayload) {
  const customer = payload.customer ?? {};
  const service = payload.service ?? {};
  const device = payload.device ?? {};
  const schedule = payload.schedule ?? {};
  const metadata = payload.metadata ?? {};

  return [
    ["Lead source", payload.source],
    ["Customer name", customer.name],
    ["Phone", customer.phone],
    ["Email", customer.email],
    ["Service type", service.type],
    ["Service", service.label],
    ["Price", formatMoney(service.price)],
    ["Brand", device.brand],
    ["Series", device.series],
    ["Model", device.model],
    ["Booking code", payload.bookingCode],
    ["Scheduled date", schedule.date],
    ["Time slot", schedule.timeSlot],
    ["Address", payload.address],
    ["City", payload.city],
    ["Pincode", payload.pincode],
    ["Notes", payload.notes],
    ["Page URL", payload.pageUrl],
    ...Object.entries(metadata).map(([key, value]) => [key, value]),
  ].filter(([, value]) => asText(value).length > 0);
}

function buildLeadEmail(payload: LeadPayload) {
  const customerName = asText(payload.customer?.name) || "New customer";
  const phone = asText(payload.customer?.phone);
  const serviceLabel = asText(payload.service?.label || payload.service?.type || payload.title || "Lead");
  const subject = `[Looplic Lead] ${serviceLabel} - ${customerName}${phone ? ` (${phone})` : ""}`;
  const rows = buildRows(payload);
  const text = [
    payload.title || "New Looplic lead",
    "",
    ...rows.map(([label, value]) => `${label}: ${asText(value)}`),
  ].join("\n");
  const htmlRows = rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#64748b;font-size:13px;width:34%;">${escapeHtml(asText(label))}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#0f172a;font-size:14px;font-weight:600;">${escapeHtml(asText(value)).replace(/\n/g, "<br />")}</td>
        </tr>
      `,
    )
    .join("");
  const html = `
    <div style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
      <div style="max-width:680px;margin:0 auto;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;background:#ffffff;">
        <div style="padding:20px 22px;background:#0096ff;color:#ffffff;">
          <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">Looplic Lead</div>
          <h1 style="margin:8px 0 0;font-size:22px;line-height:1.3;">${escapeHtml(payload.title || "New lead received")}</h1>
        </div>
        <table style="width:100%;border-collapse:collapse;">${htmlRows}</table>
      </div>
    </div>
  `;

  return { subject, text, html };
}

function buildCustomerBookingEmail(payload: LeadPayload) {
  const customerName = asText(payload.customer?.name) || "there";
  const serviceLabel = asText(payload.service?.label || payload.service?.type || "your selected service");
  const deviceName = [payload.device?.brand, payload.device?.series, payload.device?.model].map(asText).filter(Boolean).join(" ");
  const bookingCode = asText(payload.bookingCode);
  const scheduledDate = asText(payload.schedule?.date);
  const timeSlot = asText(payload.schedule?.timeSlot);
  const address = [payload.address, payload.city, payload.pincode].map(asText).filter(Boolean).join(", ");
  const visitingChargePolicy = getVisitingChargePolicy(payload.service?.type);
  const subject = bookingCode ? `Looplic booking confirmed - ${bookingCode}` : "Looplic booking confirmed";
  const rows = [
    ["Booking ID", bookingCode],
    ["Selected service", serviceLabel],
    ["Device", deviceName],
    ["Scheduled date", scheduledDate],
    ["Preferred time", timeSlot],
    ["Service address", address],
    ["Visiting charge", visitingChargePolicy],
  ].filter(([, value]) => asText(value).length > 0);
  const text = [
    `Hi ${customerName},`,
    "",
    "Thank you for choosing Looplic. Your booking request has been received successfully.",
    "Our technician or support team will reach out to you shortly to confirm the service details and next steps.",
    "",
    ...rows.map(([label, value]) => `${label}: ${asText(value)}`),
    "",
    "Important customer terms:",
    `1. ${CUSTOMER_DIRECT_DEAL_WARNING}`,
    `2. ${CUSTOMER_DIRECT_PITCH_PROOF}`,
    `Full terms: ${TERMS_URL}`,
    "",
    "If you need to update anything, you can reply to this email or contact Looplic support.",
    "",
    "Best regards,",
    "Looplic Team",
  ].join("\n");
  const htmlRows = rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:14px 16px;border-bottom:1px solid #e8edf3;color:#64748b;font-size:13px;line-height:1.5;width:38%;">${escapeHtml(asText(label))}</td>
          <td style="padding:14px 16px;border-bottom:1px solid #e8edf3;color:#0f172a;font-size:14px;line-height:1.5;font-weight:700;">${escapeHtml(asText(value))}</td>
        </tr>
      `,
    )
    .join("");
  const html = `
    <div style="margin:0;padding:0;background:#eef6fb;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Your Looplic booking request has been received. Our technician will reach out shortly.</div>
      <div style="max-width:720px;margin:0 auto;padding:28px 16px;">
        <div style="overflow:hidden;border:1px solid #dbe8f1;border-radius:24px;background:#ffffff;box-shadow:0 18px 50px rgba(15,23,42,0.08);">
          <div style="padding:24px;background:#0096ff;border-bottom:1px solid #0284c7;">
            <img src="${LOGO_URL}" width="170" alt="Looplic" style="display:block;width:170px;max-width:170px;height:auto;border:0;outline:none;text-decoration:none;" />
          </div>
          <div style="padding:30px 24px 28px;background:#eaf7ff;color:#0f172a;border-bottom:1px solid #dbeafe;">
            <div style="display:inline-block;margin-bottom:14px;border-radius:999px;background:#dff3ff;color:#0369a1;padding:7px 12px;font-size:12px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">Booking Confirmed</div>
            <h1 style="margin:0;font-size:28px;line-height:1.25;font-weight:800;color:#0f172a;">Thank you for choosing Looplic</h1>
            <p style="margin:12px 0 0;max-width:560px;font-size:15px;line-height:1.7;color:#475569;">Your booking request has been received successfully. Our technician or support team will reach out shortly to confirm the service details and next steps.</p>
          </div>
          <div style="padding:26px 24px 8px;">
            <p style="margin:0 0 12px;font-size:16px;line-height:1.7;color:#0f172a;">Hi <strong>${escapeHtml(customerName)}</strong>,</p>
            <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#475569;">We have saved your request and shared it with the Looplic team. Please keep your phone reachable so we can confirm availability, timing, and any inspection details.</p>
            <div style="margin:20px 0;border:1px solid #e8edf3;border-radius:18px;overflow:hidden;background:#fbfdff;">
              <div style="padding:14px 16px;background:#f8fbff;border-bottom:1px solid #e8edf3;font-size:13px;font-weight:800;color:#0f172a;text-transform:uppercase;letter-spacing:0.06em;">Booking details</div>
              <table role="presentation" style="width:100%;border-collapse:collapse;">${htmlRows}</table>
            </div>
            <div style="margin:22px 0 0;border-radius:18px;background:#ecfdf5;border:1px solid #bbf7d0;padding:16px;">
              <div style="font-size:14px;font-weight:800;color:#047857;">What happens next?</div>
              <p style="margin:7px 0 0;font-size:14px;line-height:1.7;color:#065f46;">A Looplic technician or support executive will contact you to confirm the visit, quote, and repair flow before work begins.</p>
            </div>
            <div style="margin:16px 0 0;border-radius:18px;background:#fff7ed;border:1px solid #fed7aa;padding:16px;">
              <div style="font-size:14px;font-weight:800;color:#9a3412;">Important customer terms</div>
              <ol style="margin:8px 0 0;padding-left:20px;color:#7c2d12;font-size:13px;line-height:1.7;">
                <li>${escapeHtml(CUSTOMER_DIRECT_DEAL_WARNING)}</li>
                <li>${escapeHtml(CUSTOMER_DIRECT_PITCH_PROOF)}</li>
              </ol>
              <p style="margin:10px 0 0;font-size:13px;line-height:1.7;color:#9a3412;">Read the full customer terms: <a href="${TERMS_URL}" style="color:#0369a1;font-weight:800;text-decoration:none;">${TERMS_URL}</a></p>
            </div>
            <p style="margin:22px 0 0;font-size:14px;line-height:1.7;color:#475569;">If you need to update anything, just reply to this email. We are happy to help.</p>
            <p style="margin:18px 0 0;font-size:15px;line-height:1.7;color:#0f172a;font-weight:800;">Looplic Team</p>
          </div>
          <div style="padding:18px 24px 24px;color:#64748b;font-size:12px;line-height:1.6;">
            <div style="border-top:1px solid #e8edf3;padding-top:16px;">This confirmation was sent by Looplic for your service booking request.</div>
          </div>
        </div>
      </div>
    </div>
  `;

  return { subject, text, html };
}

async function sendResendEmail(input: ResendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return { ok: false, status: 503, error: "RESEND_API_KEY is not configured." };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: input.from,
        to: [input.to],
        subject: input.subject,
        text: input.text,
        html: input.html,
        reply_to: input.replyTo ? [input.replyTo] : undefined,
        attachments: input.attachments,
      }),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: data?.message || data?.error || "Resend email request failed.",
      };
    }

    return { ok: true, status: response.status, data };
  } catch (error) {
    return {
      ok: false,
      status: 500,
      error: error instanceof Error ? error.message : "Unable to send lead email.",
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function sendPickupAgreementEmail(input: PickupAgreementEmailInput) {
  const from = process.env.RESEND_FROM_EMAIL || DEFAULT_FROM_EMAIL;
  const subject = input.bookingCode ? `Looplic Pickup agreement - ${input.bookingCode}` : "Looplic Pickup agreement";
  const rows = [
    ["Booking ID", input.bookingCode],
    ["Service", input.serviceLabel],
    ["Device", input.deviceLabel],
    ["Customer phone", input.customerPhone],
    ["Reported issue", input.issue],
    ["Device condition", input.deviceCondition],
    ["Accessories received", input.accessories],
    ["Pickup date and time", input.pickupDateTime],
    ["Expected drop date and time", input.dropDateTime],
    ["Pickup address", input.pickupAddress],
    ["Handover person", input.pickupPerson],
    ["Estimated quote", formatMoney(input.estimatedQuote)],
    ["Technician", input.technicianEmail],
    ["Notes", input.notes],
  ].filter(([, value]) => asText(value).length > 0);
  const text = [
    `Hi ${input.customerName || "there"},`,
    "",
    "Your Looplic pickup agreement is confirmed. Please review the pickup, drop, device condition, issue, accessories, and quote details below.",
    "",
    ...rows.map(([label, value]) => `${label}: ${asText(value)}`),
    "",
    "A PDF copy of this pickup agreement is attached for your records.",
    "",
    "Important: Please do not deal directly with any technician outside Looplic. Keep this email and agreement PDF as your pickup proof.",
    "",
    "Best regards,",
    "Looplic Team",
  ].join("\n");
  const htmlRows = rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:12px 14px;border-bottom:1px solid #e8edf3;color:#64748b;font-size:13px;width:38%;">${escapeHtml(asText(label))}</td>
          <td style="padding:12px 14px;border-bottom:1px solid #e8edf3;color:#0f172a;font-size:14px;font-weight:700;line-height:1.5;">${escapeHtml(asText(value)).replace(/\n/g, "<br />")}</td>
        </tr>
      `,
    )
    .join("");
  const html = `
    <div style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Looplic pickup agreement with device, issue, pickup, and return details.</div>
      <div style="max-width:720px;margin:0 auto;padding:28px 16px;">
        <div style="overflow:hidden;border:1px solid #dbe8f1;border-radius:22px;background:#ffffff;box-shadow:0 18px 45px rgba(15,23,42,0.08);">
          <div style="padding:22px 24px;background:#0096ff;color:#ffffff;">
            <img src="${LOGO_URL}" width="160" alt="Looplic" style="display:block;width:160px;max-width:160px;height:auto;border:0;" />
            <div style="margin-top:18px;font-size:12px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;">Pickup Agreement</div>
            <h1 style="margin:8px 0 0;font-size:24px;line-height:1.25;">Your device pickup is documented</h1>
          </div>
          <div style="padding:24px;">
            <p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#334155;">Hi <strong>${escapeHtml(input.customerName || "there")}</strong>,</p>
            <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#475569;">Looplic has recorded the pickup agreement for your device. Please check the details below and keep the attached PDF as your proof of pickup.</p>
            <div style="overflow:hidden;border:1px solid #e8edf3;border-radius:16px;background:#fbfdff;">
              <div style="padding:14px 16px;background:#f8fbff;border-bottom:1px solid #e8edf3;font-size:12px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;">Agreement details</div>
              <table role="presentation" style="width:100%;border-collapse:collapse;">${htmlRows}</table>
            </div>
            <div style="margin-top:18px;border-radius:16px;background:#fff7ed;border:1px solid #fed7aa;padding:15px;">
              <div style="font-size:14px;font-weight:800;color:#9a3412;">Important pickup note</div>
              <p style="margin:7px 0 0;font-size:13px;line-height:1.7;color:#7c2d12;">Do not deal directly with any technician outside Looplic. Keep all payments, warranty, repair approvals, and follow-up communication inside Looplic channels.</p>
            </div>
            <p style="margin:20px 0 0;font-size:14px;line-height:1.7;color:#475569;">The attached PDF has the same details for your records.</p>
            <p style="margin:18px 0 0;font-size:15px;font-weight:800;color:#0f172a;">Looplic Team</p>
          </div>
        </div>
      </div>
    </div>
  `;

  return sendResendEmail({
    to: input.to,
    from,
    subject,
    text,
    html,
    replyTo: process.env.RESEND_REPLY_TO || DEFAULT_LEAD_TO_EMAIL,
    attachments: [
      {
        filename: input.pdfFilename,
        content: input.pdfBase64,
      },
    ],
  });
}

export async function sendLeadEmail(payload: LeadPayload) {
  const { subject, text, html } = buildLeadEmail(payload);
  const to = process.env.RESEND_LEADS_TO || DEFAULT_LEAD_TO_EMAIL;
  const from = process.env.RESEND_FROM_EMAIL || DEFAULT_FROM_EMAIL;
  const replyTo = asText(payload.customer?.email) || undefined;

  return sendResendEmail({ to, from, subject, text, html, replyTo });
}

export async function sendCustomerBookingConfirmation(payload: LeadPayload) {
  const customerEmail = asText(payload.customer?.email);

  if (!customerEmail) {
    return { ok: true, status: 204, skipped: true };
  }

  const { subject, text, html } = buildCustomerBookingEmail(payload);
  const from = process.env.RESEND_FROM_EMAIL || DEFAULT_FROM_EMAIL;

  return sendResendEmail({
    to: customerEmail,
    from,
    subject,
    text,
    html,
    replyTo: process.env.RESEND_REPLY_TO || DEFAULT_LEAD_TO_EMAIL,
  });
}
