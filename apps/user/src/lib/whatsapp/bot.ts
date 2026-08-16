import { companyName, supportPhoneDisplay } from "@/src/lib/company";

import { runAiTurn, isAiEnabled } from "./ai";
import { markRead, sendButtons, sendText } from "./client";
import { isWhatsappConfigured } from "./config";
import { detectIntent } from "./flow/intent";
import { handleFlowMessage, renderStep, showMainMenu, startFlowAt } from "./flow/machine";
import { NAV, parseId } from "./flow/ids";
import type { FlowContext, FlowStep } from "./flow/types";
import { notifyTeamHandoff } from "./notify";
import {
  claimInboundMessage,
  clearFlow,
  getRecentMessages,
  isFlowSessionFresh,
  isHandoffActive,
  logInbound,
  releaseHandoff,
  setHandoff,
  setOptOut,
  setState,
  upsertConversationInbound,
} from "./store";

// The inbound message router.
//
// Lanes, in priority order:
//   1. Compliance    — STOP/START opt-out, handled before anything else.
//   2. Idempotency   — Meta redelivers messages; a replayed tap must not book twice.
//   3. Handoff       — a human owns the chat, the bot stays quiet.
//   4. Global words  — menu / cancel / agent / track work from anywhere.
//   5. The wizard    — the tap-driven booking flow (the primary path).
//   6. Intent        — free text that clearly means "book a repair" hands INTO the wizard.
//   7. The AI agent  — everything else, with a canned fallback.

export type IncomingMessage = {
  waId: string; // sender phone (E.164 without '+')
  profileName?: string | null;
  messageId: string;
  type: string; // text | interactive | image | ...
  text: string; // best-effort plain text (button id/title folded in)
  buttonId?: string | null; // set when the user tapped a quick-reply button or list row
  // Which of our business numbers this arrived on (Meta's phone_number_id, NOT
  // the phone number itself). The webhook already scopes the whole handling of
  // this message to it via phone-context.ts, so nothing downstream needs to
  // read this field — it's here for logging/debugging only.
  phoneNumberId?: string | null;
};

const GREETING_RE = /^(hi|hii+|hey|hello|hola|start|menu|main menu|namaste|good (morning|evening|afternoon))\b/i;
const MENU_RE = /^(menu|main menu|home|start over|restart|options)$/i;
const CANCEL_RE = /^(cancel|stop booking|nevermind|never mind|exit|quit)$/i;
const AGENT_RE = /^(agent|human|talk to (a )?(human|person|agent|team)|support|customer care|call me)$/i;
const TRACK_RE = /^(track|status|my orders?|my bookings?)$/i;
const OPT_OUT_RE = /^(stop|unsubscribe|opt ?out)$/i;
const OPT_IN_RE = /^(start|subscribe|opt ?in|resume)$/i;

// How long a handoff silences the bot before it resumes on its own.
const HANDOFF_MINUTES = 120;

async function fallbackReply(waId: string): Promise<void> {
  await sendText(
    waId,
    `Thanks for your message! Our team will get back to you shortly. For anything urgent, call us at ${supportPhoneDisplay}.`,
    "fallback",
  );
}

async function startHandoff(waId: string, profileName?: string | null): Promise<void> {
  await setHandoff(waId, HANDOFF_MINUTES);
  await sendText(
    waId,
    `Sure — I've passed this to our team 💬 Someone will reply here shortly. You can also call us on ${supportPhoneDisplay}.\n\nType *menu* anytime to go back to booking.`,
    "handoff",
  );
  await notifyTeamHandoff(waId, profileName ?? null).catch((err) =>
    console.error("[whatsapp:bot] handoff alert failed", err),
  );
}

// Entry point: process a single inbound message end-to-end.
export async function handleIncomingMessage(msg: IncomingMessage): Promise<void> {
  if (!isWhatsappConfigured()) return;

  const { waId, messageId, type, text, buttonId, profileName } = msg;

  // ── 2. Idempotency ────────────────────────────────────────────────────────
  // Claim the message id BEFORE doing any work. Meta retries a webhook whenever
  // our 200 is slow or lost, and replaying a "Confirm" tap would create a second
  // booking for the same customer.
  const fresh = await claimInboundMessage(messageId, waId);
  if (!fresh) {
    console.info("[whatsapp:bot] duplicate delivery ignored", { waId, messageId });
    return;
  }

  void markRead(messageId);
  const conversation = await upsertConversationInbound(waId, profileName);
  await logInbound(waId, type, text || buttonId || null, messageId);

  const trimmed = (text || "").trim();

  // ── 1. Compliance ─────────────────────────────────────────────────────────
  if (OPT_OUT_RE.test(trimmed)) {
    await setOptOut(waId, true);
    await clearFlow(waId);
    await sendText(
      waId,
      `You're unsubscribed — we won't message you again. Send *START* anytime to turn messages back on, or call ${supportPhoneDisplay}.`,
      "opt-out",
    );
    return;
  }
  if (conversation?.optedOut) {
    if (OPT_IN_RE.test(trimmed)) {
      await setOptOut(waId, false);
      await showMainMenu(waId, "Welcome back! You're subscribed again ✅");
      return;
    }
    // Stay silent apart from telling them how to come back.
    await sendText(waId, "You're unsubscribed. Send *START* to turn messages back on.", "opt-out-reminder");
    return;
  }

  // ── 3. Handoff ────────────────────────────────────────────────────────────
  const parsed = parseId(buttonId);
  const wantsAgent = parsed?.value === NAV.agent || AGENT_RE.test(trimmed);
  if (wantsAgent) {
    await startHandoff(waId, profileName);
    return;
  }
  if (isHandoffActive(conversation)) {
    // A human is on it. The only thing that wakes the bot is an explicit menu.
    if (MENU_RE.test(trimmed)) {
      await releaseHandoff(waId);
      await showMainMenu(waId);
    }
    return;
  }

  // ── 4. Global words ───────────────────────────────────────────────────────
  if (MENU_RE.test(trimmed)) {
    await showMainMenu(waId);
    return;
  }
  if (CANCEL_RE.test(trimmed)) {
    await clearFlow(waId);
    await sendText(waId, "Cancelled. Type *menu* whenever you'd like to start again 🙂", "cancel");
    return;
  }
  if (TRACK_RE.test(trimmed)) {
    await startFlowAt(waId, "track_code", { kind: "track" });
    return;
  }

  // ── 5. The wizard ─────────────────────────────────────────────────────────
  const storedStep = (conversation?.flowStep as FlowStep | undefined) ?? "idle";
  const storedContext = (conversation?.flowContext as FlowContext | null) ?? {};
  const sessionFresh = isFlowSessionFresh(conversation ?? null);
  const inFlow = storedStep !== "idle" && sessionFresh;

  // A tap always belongs to the wizard, even from a message sent days ago —
  // that's how customers actually use WhatsApp.
  if (parsed) {
    const handled = await handleFlowMessage(
      waId,
      inFlow ? storedStep : (parsed.kind === "option" ? parsed.step : "idle"),
      inFlow ? storedContext : {},
      { text: trimmed, interactiveId: buttonId ?? null },
    );
    if (handled) return;
  }

  if (inFlow) {
    // Typed text while inside the wizard — the current step interprets it.
    const handled = await handleFlowMessage(waId, storedStep, storedContext, {
      text: trimmed,
      interactiveId: null,
    });
    if (handled) return;
  }

  // A stale wizard session: greet fresh rather than resuming a week-old booking.
  if (storedStep !== "idle" && !sessionFresh) {
    await clearFlow(waId);
  }

  // ── Non-text messages (image, location, contact…) ─────────────────────────
  if (!trimmed) {
    await sendButtons(
      waId,
      "Thanks — got that! 📎 Tell me what you'd like to do, or tap below.",
      [
        { id: NAV.menu, title: "Book a service" },
        { id: NAV.agent, title: "Talk to our team" },
      ],
      "non-text",
    );
    return;
  }

  // ── Greetings ─────────────────────────────────────────────────────────────
  if (GREETING_RE.test(trimmed)) {
    await showMainMenu(waId);
    return;
  }

  // ── 6. Intent hand-in ─────────────────────────────────────────────────────
  // "my iphone 12 screen is cracked" → straight to the repair picker for that
  // model, with real prices, instead of a chat about it.
  try {
    const intent = await detectIntent(trimmed);
    if (intent) {
      await startFlowAt(waId, intent.step, intent.context, intent.note);
      return;
    }
  } catch (err) {
    console.error("[whatsapp:bot] intent detection failed", err);
  }

  // ── 7. The AI agent ───────────────────────────────────────────────────────
  if (isAiEnabled()) {
    await setState(waId, "ai");
    const history = await getRecentMessages(waId, 12);
    const reply = await runAiTurn(waId, history);
    if (reply) {
      await sendText(waId, reply, "ai");
      // Always leave a way back into the guided flow.
      await sendButtons(
        waId,
        `Anything else I can do for you?`,
        [
          { id: NAV.menu, title: "Book a service" },
          { id: NAV.agent, title: "Talk to our team" },
        ],
        "ai-followup",
      );
      return;
    }
  }
  await fallbackReply(waId);
}

// Re-exported so the webhook and the simulator can render a step directly.
export { renderStep, showMainMenu, startFlowAt };
export const BOT_COMPANY_NAME = companyName;
