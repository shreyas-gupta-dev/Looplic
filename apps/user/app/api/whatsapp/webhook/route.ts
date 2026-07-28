import { NextResponse } from "next/server";

import { verifySignature } from "@/src/lib/whatsapp/client";
import { whatsappConfig } from "@/src/lib/whatsapp/config";
import { handleIncomingMessage, type IncomingMessage } from "@/src/lib/whatsapp/bot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET: Meta's webhook verification handshake. Configured once when you point the
// WhatsApp app at this URL. Echo hub.challenge back when the verify token matches.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token && token === whatsappConfig.verifyToken) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

// Extracts the messages we care about from the webhook envelope. Status/receipt
// events and anything malformed are simply skipped.
function extractMessages(payload: any): IncomingMessage[] {
  const out: IncomingMessage[] = [];
  const entries = Array.isArray(payload?.entry) ? payload.entry : [];
  for (const entry of entries) {
    const changes = Array.isArray(entry?.changes) ? entry.changes : [];
    for (const change of changes) {
      const value = change?.value;
      const messages = Array.isArray(value?.messages) ? value.messages : [];
      const contactName = value?.contacts?.[0]?.profile?.name ?? null;

      for (const m of messages) {
        const waId: string = m?.from;
        const messageId: string = m?.id;
        if (!waId || !messageId) continue;

        let text = "";
        let buttonId: string | null = null;

        if (m.type === "text") {
          text = m.text?.body ?? "";
        } else if (m.type === "interactive") {
          const i = m.interactive;
          if (i?.type === "button_reply") {
            buttonId = i.button_reply?.id ?? null;
            text = i.button_reply?.title ?? "";
          } else if (i?.type === "list_reply") {
            buttonId = i.list_reply?.id ?? null;
            text = i.list_reply?.title ?? "";
          }
        } else if (m.type === "button") {
          // Quick-reply from a template message.
          buttonId = m.button?.payload ?? null;
          text = m.button?.text ?? "";
        }

        out.push({ waId, profileName: contactName, messageId, type: m.type ?? "text", text, buttonId });
      }
    }
  }
  return out;
}

// POST: incoming messages + status callbacks from Meta.
export async function POST(request: Request) {
  // Read the raw body so we can verify the signature over the exact bytes.
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!verifySignature(rawBody, signature)) {
    console.warn("[whatsapp:webhook] signature verification failed");
    return new NextResponse("Forbidden", { status: 403 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new NextResponse("Bad Request", { status: 400 });
  }

  const messages = extractMessages(payload);

  // Process inline (before responding) so replies are reliably delivered — on
  // serverless the execution context can be frozen after the response is sent,
  // which would drop any fire-and-forget work. We still always return 200 so
  // Meta doesn't retry (a non-200 triggers redelivery of the same messages).
  for (const msg of messages) {
    try {
      await handleIncomingMessage(msg);
    } catch (err) {
      console.error(`[whatsapp:webhook] handler error: ${err instanceof Error ? err.message : err}`);
    }
  }

  return NextResponse.json({ ok: true });
}
