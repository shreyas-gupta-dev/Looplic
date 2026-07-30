import { NextResponse } from "next/server";

import { handleIncomingMessage } from "@/src/lib/whatsapp/bot";
import { beginCapture, drainCapture, type CapturedMessage } from "@/src/lib/whatsapp/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────────────
// Conversation simulator (development only).
//
// Drives the real inbound router end-to-end — same state machine, same catalog,
// same pricing — but captures the outbound messages instead of sending them to
// Meta. Lets you walk the whole booking wizard without a phone, a Meta app or an
// access token.
//
//   POST /api/whatsapp/simulate  { "waId": "919999900001", "text": "hi" }
//   POST /api/whatsapp/simulate  { "waId": "919999900001", "buttonId": "f:service:mobile_repair" }
//
// The response lists every message the bot would have sent, with the tappable
// option ids, so you can chain the next call.
//
// ⚠️  It writes to whatever database DATABASE_URL points at — including real
// bookings if you drive it all the way to Confirm. Point it at a scratch
// database, or use a throwaway waId and clean up after.
//
// Enabled only when WHATSAPP_SIMULATOR=1 and NODE_ENV is not production.
// ─────────────────────────────────────────────────────────────────────────────

function isEnabled(): boolean {
  return process.env.WHATSAPP_SIMULATOR === "1" && process.env.NODE_ENV !== "production";
}

// Flattens a Cloud API payload into something readable in a terminal.
function describe(message: CapturedMessage) {
  const payload = message.payload as any;
  const interactive = payload.interactive;

  if (payload.type === "text") {
    return { kind: "text", context: message.context, body: payload.text?.body };
  }
  if (interactive?.type === "button") {
    return {
      kind: "buttons",
      context: message.context,
      body: interactive.body?.text,
      options: (interactive.action?.buttons ?? []).map((button: any) => ({
        id: button.reply?.id,
        title: button.reply?.title,
      })),
    };
  }
  if (interactive?.type === "list") {
    const rows = (interactive.action?.sections ?? []).flatMap((section: any) =>
      (section.rows ?? []).map((row: any) => ({ id: row.id, title: row.title, description: row.description })),
    );
    return {
      kind: "list",
      context: message.context,
      header: interactive.header?.text,
      body: interactive.body?.text,
      footer: interactive.footer?.text,
      options: rows,
    };
  }
  if (payload.type === "image") {
    return { kind: "image", context: message.context, body: payload.image?.caption };
  }
  if (payload.type === "template") {
    return { kind: "template", context: message.context, body: payload.template?.name };
  }
  return { kind: payload.type ?? "unknown", context: message.context, payload };
}

export async function POST(request: Request) {
  if (!isEnabled()) {
    return NextResponse.json(
      { error: "Simulator disabled. Set WHATSAPP_SIMULATOR=1 in a non-production environment." },
      { status: 404 },
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send a JSON body: { waId, text? , buttonId? }" }, { status: 400 });
  }

  const waId = String(body?.waId || "").replace(/\D/g, "");
  if (!waId) return NextResponse.json({ error: "waId is required" }, { status: 400 });

  const text = typeof body?.text === "string" ? body.text : "";
  const buttonId = typeof body?.buttonId === "string" ? body.buttonId : null;

  beginCapture();
  try {
    await handleIncomingMessage({
      waId,
      profileName: body?.profileName ?? "Simulator",
      // A fresh id every call, so the ledger doesn't swallow ordinary replays.
      // Pass an explicit messageId to test the duplicate-delivery guard: send
      // the same one twice and the second call must produce no messages.
      messageId:
        typeof body?.messageId === "string" && body.messageId
          ? body.messageId
          : `sim-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: buttonId ? "interactive" : "text",
      text,
      buttonId,
    });
  } catch (err) {
    drainCapture();
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "handler threw", stack: (err as Error)?.stack },
      { status: 500 },
    );
  }

  const captured = drainCapture();
  return NextResponse.json({
    sent: captured.map(describe),
    raw: body?.verbose ? captured : undefined,
  });
}
