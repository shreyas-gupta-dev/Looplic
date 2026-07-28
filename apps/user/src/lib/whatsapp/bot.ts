import { companyName, supportPhoneDisplay } from "@/src/lib/company";

import { runAiTurn, isAiEnabled } from "./ai";
import { markRead, sendButtons, sendText } from "./client";
import { isWhatsappConfigured } from "./config";
import {
  getRecentMessages,
  logInbound,
  setState,
  upsertConversationInbound,
} from "./store";

// The inbound message router. Meta delivers each incoming message here (via the
// webhook). Flow: a rule-based menu handles the common intents instantly and for
// free (greetings, the three quick-reply buttons), and anything free-text falls
// through to the Claude agent. This keeps latency + cost down for the 80% case
// while still giving a real conversational experience for everything else.

// Shape of one inbound message after we pull it out of the webhook envelope.
export type IncomingMessage = {
  waId: string; // sender phone (E.164 without '+')
  profileName?: string | null;
  messageId: string;
  type: string; // text | interactive | image | ...
  text: string; // best-effort plain text (button id/title folded in)
  buttonId?: string | null; // set when the user tapped a quick-reply button
};

const MENU_PROMPT = `Hi! 👋 Welcome to ${companyName}. How can we help you today?`;

const MENU_BUTTONS = [
  { id: "menu_repair", title: "Book a repair" },
  { id: "menu_sell", title: "Sell a device" },
  { id: "menu_talk", title: "Talk to us" },
];

const GREETING_RE = /^(hi|hii+|hey|hello|hola|start|menu|namaste|good (morning|evening|afternoon))\b/i;

async function showMenu(waId: string): Promise<void> {
  await setState(waId, "menu");
  await sendButtons(waId, MENU_PROMPT, MENU_BUTTONS, "menu");
}

// Canned reply used when the AI is unavailable (no ANTHROPIC_API_KEY or an error).
async function fallbackReply(waId: string): Promise<void> {
  await sendText(
    waId,
    `Thanks for your message! Our team will get back to you shortly. For anything urgent, call us at ${supportPhoneDisplay}.`,
    "fallback",
  );
}

async function handleButton(msg: IncomingMessage): Promise<void> {
  const { waId, buttonId } = msg;
  switch (buttonId) {
    case "menu_repair":
      await setState(waId, "ai");
      await sendText(
        waId,
        "Great — let's get your repair booked. 🔧 Which device is it (brand + model), and what's the issue? Please also share your name and area in Bengaluru.",
        "menu-repair",
      );
      return;
    case "menu_sell":
      await setState(waId, "ai");
      await sendText(
        waId,
        "Nice! 📱 Tell me the device you want to sell (brand + model) and its condition, plus your name — I'll get you an estimate and arrange free pickup.",
        "menu-sell",
      );
      return;
    case "menu_talk":
      await setState(waId, "ai");
      await sendText(
        waId,
        `Sure — what do you need help with? You can also reach our team directly at ${supportPhoneDisplay}.`,
        "menu-talk",
      );
      return;
    default:
      await showMenu(waId);
  }
}

// Entry point: process a single inbound message end-to-end.
export async function handleIncomingMessage(msg: IncomingMessage): Promise<void> {
  if (!isWhatsappConfigured()) return;

  const { waId, messageId, type, text, buttonId, profileName } = msg;

  // Best-effort: read receipt + persistence. None of these block the reply.
  void markRead(messageId);
  await upsertConversationInbound(waId, profileName);
  await logInbound(waId, type, text || buttonId || null, messageId);

  // 1) Quick-reply button taps.
  if (buttonId) {
    await handleButton(msg);
    return;
  }

  const trimmed = (text || "").trim();

  // 2) Empty / non-text (image, location, etc.) — nudge to the menu.
  if (!trimmed) {
    await sendText(
      waId,
      "Thanks! We've received that. Reply with a message describing what you need, or type 'menu' to see options.",
      "non-text",
    );
    return;
  }

  // 3) Greetings / explicit "menu" → show the button menu.
  if (GREETING_RE.test(trimmed)) {
    await showMenu(waId);
    return;
  }

  // 4) Everything else → the AI agent, with a canned fallback.
  if (isAiEnabled()) {
    const history = await getRecentMessages(waId, 12);
    const reply = await runAiTurn(waId, history);
    if (reply) {
      await sendText(waId, reply, "ai");
      return;
    }
  }
  await fallbackReply(waId);
}
