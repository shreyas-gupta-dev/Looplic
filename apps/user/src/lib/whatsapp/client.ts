import crypto from "crypto";

import { graphMessagesUrl, isWhatsappConfigured, whatsappConfig } from "./config";
import { logOutbound, touchOutbound } from "./store";

// Thin wrapper over the Meta WhatsApp Cloud API `/messages` endpoint plus the
// webhook signature check. All sends are best-effort: a failure is logged and
// surfaced via the return value but never throws, so one bad send can't take
// down the webhook handler (which must always answer Meta with a 200).

type SendResult = { ok: boolean; messageId?: string; error?: string; status?: number };

// ─── Simulation capture ───────────────────────────────────────────────────────
// When a capture buffer is open, sends are recorded instead of being posted to
// Meta. Used by the dev-only /api/whatsapp/simulate route to drive the whole
// wizard without a phone, a Meta app or a single real message. Off unless a
// caller explicitly opens a buffer, so production is untouched.

export type CapturedMessage = { to: string; context: string; payload: Record<string, unknown> };

let captureBuffer: CapturedMessage[] | null = null;

export function beginCapture(): void {
  captureBuffer = [];
}

export function drainCapture(): CapturedMessage[] {
  const captured = captureBuffer ?? [];
  captureBuffer = null;
  return captured;
}

async function postMessage(payload: Record<string, unknown>, context: string): Promise<SendResult> {
  if (captureBuffer) {
    captureBuffer.push({ to: String(payload.to ?? ""), context, payload });
    return { ok: true, messageId: `sim-${captureBuffer.length}`, status: 200 };
  }

  if (!isWhatsappConfigured()) {
    console.warn(`[whatsapp:${context}] not configured — skipping send`, {
      to: payload.to,
    });
    return { ok: false, error: "WhatsApp not configured", status: 503 };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(graphMessagesUrl(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${whatsappConfig.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
      signal: controller.signal,
    });
    const data = (await res.json().catch(() => null)) as any;

    if (!res.ok) {
      const error = data?.error?.message || `Cloud API returned ${res.status}`;
      console.error(`[whatsapp:${context}] send failed: ${error}`, { to: payload.to, data });
      return { ok: false, error, status: res.status };
    }

    const messageId: string | undefined = data?.messages?.[0]?.id;
    console.info(`[whatsapp:${context}] sent`, { to: payload.to, messageId });
    return { ok: true, messageId, status: res.status };
  } catch (err) {
    const error = err instanceof Error ? err.message : "send threw";
    console.error(`[whatsapp:${context}] send threw: ${error}`, { to: payload.to });
    return { ok: false, error, status: 500 };
  } finally {
    clearTimeout(timeout);
  }
}

export async function sendText(to: string, body: string, context = "text"): Promise<SendResult> {
  // WhatsApp caps text bodies at 4096 chars.
  const text = body.slice(0, 4096);
  const result = await postMessage(
    { to, type: "text", text: { preview_url: false, body: text } },
    context,
  );
  if (result.ok) {
    await logOutbound(to, "text", text, result.messageId);
    await touchOutbound(to);
  }
  return result;
}

// Sends an image message with an optional caption. Used to brand the booking
// confirmation with the Looplic logo. NOTE: the Cloud API accepts image/jpeg and
// image/png by hosted link (NOT webp — that's stickers only), and the link must
// be publicly reachable, so always use a solid/colored PNG (never the white
// transparent email logo, which is invisible on WhatsApp's light image bubble).
export async function sendImage(
  to: string,
  link: string,
  caption: string,
  context = "image",
): Promise<SendResult> {
  const result = await postMessage(
    { to, type: "image", image: { link, caption: caption.slice(0, 1024) } },
    context,
  );
  if (result.ok) {
    await logOutbound(to, "image", caption, result.messageId);
    await touchOutbound(to);
  }
  return result;
}

export type ReplyButton = { id: string; title: string };

// Interactive reply buttons (max 3, titles max 20 chars). Used for the menu.
export async function sendButtons(
  to: string,
  bodyText: string,
  buttons: ReplyButton[],
  context = "buttons",
): Promise<SendResult> {
  const result = await postMessage(
    {
      to,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: bodyText.slice(0, 1024) },
        action: {
          buttons: buttons.slice(0, 3).map((b) => ({
            type: "reply",
            reply: { id: b.id, title: b.title.slice(0, 20) },
          })),
        },
      },
    },
    context,
  );
  if (result.ok) {
    await logOutbound(to, "interactive", bodyText, result.messageId);
    await touchOutbound(to);
  }
  return result;
}

export type ListRow = { id: string; title: string; description?: string | null };
export type ListSection = { title?: string | null; rows: ListRow[] };

// Cloud API limits for an interactive list. Exceeding any of these is a 400
// from Meta (i.e. a silently unanswered customer), so every caller goes through
// the truncation below rather than trusting its own strings.
export const LIST_MAX_ROWS = 10; // across ALL sections, not per section
export const LIST_MAX_SECTIONS = 10;
const LIST_ROW_TITLE_MAX = 24;
const LIST_ROW_DESC_MAX = 72;
const LIST_BUTTON_MAX = 20;
const LIST_ROW_ID_MAX = 200;
const INTERACTIVE_BODY_MAX = 1024;
const INTERACTIVE_HEADER_MAX = 60;
const INTERACTIVE_FOOTER_MAX = 60;

// Interactive list message — the workhorse of the guided booking flow (brands,
// models, repairs, time slots…). Rows are capped at 10 TOTAL, so callers must
// paginate; `sendList` truncates defensively rather than letting Meta reject the
// whole message.
export async function sendList(
  to: string,
  opts: {
    body: string;
    buttonLabel: string;
    sections: ListSection[];
    header?: string | null;
    footer?: string | null;
  },
  context = "list",
): Promise<SendResult> {
  let remaining = LIST_MAX_ROWS;
  const sections = opts.sections
    .slice(0, LIST_MAX_SECTIONS)
    .map((section) => {
      const rows = section.rows.slice(0, Math.max(0, remaining)).map((row) => ({
        id: row.id.slice(0, LIST_ROW_ID_MAX),
        title: row.title.slice(0, LIST_ROW_TITLE_MAX),
        ...(row.description ? { description: row.description.slice(0, LIST_ROW_DESC_MAX) } : {}),
      }));
      remaining -= rows.length;
      return { ...(section.title ? { title: section.title.slice(0, LIST_ROW_TITLE_MAX) } : {}), rows };
    })
    .filter((section) => section.rows.length > 0);

  if (sections.length === 0) {
    // Nothing to choose from — say so in text rather than sending an invalid list.
    return sendText(to, opts.body, `${context}-empty`);
  }

  const result = await postMessage(
    {
      to,
      type: "interactive",
      interactive: {
        type: "list",
        ...(opts.header ? { header: { type: "text", text: opts.header.slice(0, INTERACTIVE_HEADER_MAX) } } : {}),
        body: { text: opts.body.slice(0, INTERACTIVE_BODY_MAX) },
        ...(opts.footer ? { footer: { text: opts.footer.slice(0, INTERACTIVE_FOOTER_MAX) } } : {}),
        action: { button: opts.buttonLabel.slice(0, LIST_BUTTON_MAX), sections },
      },
    },
    context,
  );
  if (result.ok) {
    await logOutbound(to, "interactive", opts.body, result.messageId);
    await touchOutbound(to);
  }
  return result;
}

// Interactive CTA-URL message: a tappable button that opens a link (the model's
// page on looplic.com, the tracking page, an invoice). Nicer than a bare URL in
// text and it keeps the customer's tap inside the conversation.
export async function sendCtaUrl(
  to: string,
  opts: { body: string; buttonLabel: string; url: string; header?: string | null; footer?: string | null },
  context = "cta-url",
): Promise<SendResult> {
  const result = await postMessage(
    {
      to,
      type: "interactive",
      interactive: {
        type: "cta_url",
        ...(opts.header ? { header: { type: "text", text: opts.header.slice(0, INTERACTIVE_HEADER_MAX) } } : {}),
        body: { text: opts.body.slice(0, INTERACTIVE_BODY_MAX) },
        ...(opts.footer ? { footer: { text: opts.footer.slice(0, INTERACTIVE_FOOTER_MAX) } } : {}),
        action: {
          name: "cta_url",
          parameters: { display_text: opts.buttonLabel.slice(0, LIST_BUTTON_MAX), url: opts.url },
        },
      },
    },
    context,
  );
  if (result.ok) {
    await logOutbound(to, "interactive", opts.body, result.messageId);
    await touchOutbound(to);
  }
  // Older Cloud API versions / unapproved numbers can reject cta_url. Falling
  // back to text keeps the customer moving instead of leaving them hanging.
  if (!result.ok) {
    return sendText(to, `${opts.body}\n\n${opts.url}`, `${context}-fallback`);
  }
  return result;
}

// Approved message template — the only way to message a customer outside the
// 24h customer-service window. `bodyParams` fill the template's {{1}}, {{2}}…
export async function sendTemplate(
  to: string,
  templateName: string,
  bodyParams: string[],
  languageCode = "en",
  context = "template",
): Promise<SendResult> {
  const result = await postMessage(
    {
      to,
      type: "template",
      template: {
        name: templateName,
        language: { code: languageCode },
        components: bodyParams.length
          ? [
              {
                type: "body",
                parameters: bodyParams.map((text) => ({ type: "text", text })),
              },
            ]
          : undefined,
      },
    },
    context,
  );
  if (result.ok) {
    await logOutbound(to, "template", `${templateName}: ${bodyParams.join(" | ")}`, result.messageId);
    await touchOutbound(to);
  }
  return result;
}

// Marks an inbound message as read (blue ticks) — a small UX nicety.
export async function markRead(messageId: string): Promise<void> {
  await postMessage({ status: "read", message_id: messageId }, "mark-read");
}

// Verifies the X-Hub-Signature-256 header Meta sends on every webhook POST.
// Returns true when no app secret is configured (dev convenience) so the bot
// still works before the secret is wired up — set WHATSAPP_APP_SECRET in prod.
export function verifySignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = whatsappConfig.appSecret;
  if (!secret) {
    console.warn("[whatsapp:webhook] WHATSAPP_APP_SECRET not set — skipping signature check");
    return true;
  }
  if (!signatureHeader?.startsWith("sha256=")) return false;

  const expected = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const provided = signatureHeader.slice("sha256=".length);
  // timingSafeEqual throws on length mismatch — guard first.
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(provided, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
