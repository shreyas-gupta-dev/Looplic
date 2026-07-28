import crypto from "crypto";

import { graphMessagesUrl, isWhatsappConfigured, whatsappConfig } from "./config";
import { logOutbound, touchOutbound } from "./store";

// Thin wrapper over the Meta WhatsApp Cloud API `/messages` endpoint plus the
// webhook signature check. All sends are best-effort: a failure is logged and
// surfaced via the return value but never throws, so one bad send can't take
// down the webhook handler (which must always answer Meta with a 200).

type SendResult = { ok: boolean; messageId?: string; error?: string; status?: number };

async function postMessage(payload: Record<string, unknown>, context: string): Promise<SendResult> {
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
