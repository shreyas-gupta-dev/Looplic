import { and, desc, eq } from "drizzle-orm";

import { db } from "@/src/lib/db";
import {
  whatsappConversations,
  whatsappMessages,
  whatsappProcessedMessages,
} from "@/src/lib/db/schema";
import type { WhatsappConversation } from "@/src/lib/db/schema";

// Persistence for the WhatsApp bot. Everything here is BEST-EFFORT: if the
// migration (whatsapp_conversations / whatsapp_messages) hasn't been run yet we
// swallow the "relation does not exist" error (42P01) so the bot keeps replying
// — it just loses conversation memory until the tables exist.

// 42P01 = undefined_table (the WhatsApp migration hasn't run), 42703 =
// undefined_column (the flow-state migration hasn't run). Both mean "schema is
// behind the code" and must degrade quietly — the bot keeps replying, it just
// can't remember anything until the migration is applied.
function isMissingSchema(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string } };
  const code = e?.code ?? e?.cause?.code;
  return code === "42P01" || code === "42703";
}

async function safe<T>(fn: () => Promise<T>, fallback: T, context: string): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (isMissingSchema(err)) return fallback;
    console.error(`[whatsapp:store:${context}] ${err instanceof Error ? err.message : err}`);
    return fallback;
  }
}

export type ConversationState = "new" | "menu" | "ai" | "handoff" | "flow";

export async function getConversation(waId: string): Promise<WhatsappConversation | null> {
  return safe(
    async () => {
      const rows = await db
        .select()
        .from(whatsappConversations)
        .where(eq(whatsappConversations.waId, waId))
        .limit(1);
      return rows[0] ?? null;
    },
    null,
    "getConversation",
  );
}

// Upserts the conversation on an inbound message and returns the fresh row.
export async function upsertConversationInbound(
  waId: string,
  profileName?: string | null,
): Promise<WhatsappConversation | null> {
  return safe(
    async () => {
      const rows = await db
        .insert(whatsappConversations)
        .values({ waId, profileName: profileName ?? null, lastInboundAt: new Date() })
        .onConflictDoUpdate({
          target: whatsappConversations.waId,
          set: {
            profileName: profileName ?? undefined,
            lastInboundAt: new Date(),
            updatedAt: new Date(),
          },
        })
        .returning();
      return rows[0] ?? null;
    },
    null,
    "upsertConversationInbound",
  );
}

export async function setState(waId: string, state: ConversationState): Promise<void> {
  await safe(
    async () => {
      await db
        .update(whatsappConversations)
        .set({ state, updatedAt: new Date() })
        .where(eq(whatsappConversations.waId, waId));
    },
    undefined,
    "setState",
  );
}

export async function setLastBookingCode(waId: string, bookingCode: string): Promise<void> {
  await safe(
    async () => {
      await db
        .update(whatsappConversations)
        .set({ lastBookingCode: bookingCode, updatedAt: new Date() })
        .where(eq(whatsappConversations.waId, waId));
    },
    undefined,
    "setLastBookingCode",
  );
}

export async function touchOutbound(waId: string): Promise<void> {
  await safe(
    async () => {
      await db
        .update(whatsappConversations)
        .set({ lastOutboundAt: new Date(), updatedAt: new Date() })
        .where(eq(whatsappConversations.waId, waId));
    },
    undefined,
    "touchOutbound",
  );
}

export async function logInbound(
  waId: string,
  type: string,
  body: string | null,
  messageId?: string | null,
): Promise<void> {
  await safe(
    async () => {
      await db.insert(whatsappMessages).values({
        waId,
        direction: "inbound",
        type,
        body,
        messageId: messageId ?? null,
      });
    },
    undefined,
    "logInbound",
  );
}

export async function logOutbound(
  waId: string,
  type: string,
  body: string | null,
  messageId?: string | null,
): Promise<void> {
  await safe(
    async () => {
      await db.insert(whatsappMessages).values({
        waId,
        direction: "outbound",
        type,
        body,
        messageId: messageId ?? null,
      });
    },
    undefined,
    "logOutbound",
  );
}

// ─── Guided-booking wizard state ──────────────────────────────────────────────

// A wizard session this old is considered abandoned: the customer is greeted
// fresh rather than dropped back into a half-filled booking from last week.
export const FLOW_SESSION_TTL_MS = 24 * 60 * 60 * 1000;

// Persists the wizard step + all selections made so far. Called on every step
// transition, so it is deliberately a single UPDATE.
export async function setFlow(
  waId: string,
  flowStep: string,
  flowContext: Record<string, unknown>,
): Promise<void> {
  await safe(
    async () => {
      await db
        .update(whatsappConversations)
        .set({
          state: flowStep === "idle" ? "menu" : "flow",
          flowStep,
          flowContext,
          flowUpdatedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(whatsappConversations.waId, waId));
    },
    undefined,
    "setFlow",
  );
}

export async function clearFlow(waId: string): Promise<void> {
  await safe(
    async () => {
      await db
        .update(whatsappConversations)
        .set({
          state: "menu",
          flowStep: "idle",
          flowContext: null,
          flowUpdatedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(whatsappConversations.waId, waId));
    },
    undefined,
    "clearFlow",
  );
}

// True when the stored wizard session is still fresh enough to resume.
export function isFlowSessionFresh(conversation: WhatsappConversation | null): boolean {
  if (!conversation?.flowUpdatedAt) return false;
  return Date.now() - new Date(conversation.flowUpdatedAt).getTime() < FLOW_SESSION_TTL_MS;
}

// ─── Handoff / opt-out ────────────────────────────────────────────────────────

// Silences the bot for `minutes` while a human handles the chat.
export async function setHandoff(waId: string, minutes: number): Promise<void> {
  await safe(
    async () => {
      await db
        .update(whatsappConversations)
        .set({
          state: "handoff",
          handoffUntil: new Date(Date.now() + minutes * 60 * 1000),
          updatedAt: new Date(),
        })
        .where(eq(whatsappConversations.waId, waId));
    },
    undefined,
    "setHandoff",
  );
}

export async function releaseHandoff(waId: string): Promise<void> {
  await safe(
    async () => {
      await db
        .update(whatsappConversations)
        .set({ state: "menu", handoffUntil: null, updatedAt: new Date() })
        .where(eq(whatsappConversations.waId, waId));
    },
    undefined,
    "releaseHandoff",
  );
}

export function isHandoffActive(conversation: WhatsappConversation | null): boolean {
  if (!conversation?.handoffUntil) return false;
  return new Date(conversation.handoffUntil).getTime() > Date.now();
}

export async function setOptOut(waId: string, optedOut: boolean): Promise<void> {
  await safe(
    async () => {
      await db
        .update(whatsappConversations)
        .set({ optedOut, updatedAt: new Date() })
        .where(eq(whatsappConversations.waId, waId));
    },
    undefined,
    "setOptOut",
  );
}

// ─── Webhook idempotency ──────────────────────────────────────────────────────

// Claims an inbound message id. Returns true the FIRST time a message id is
// seen and false for every redelivery, so the caller can skip replaying a tap.
// If the ledger table is missing we return true (process it) — degrading to the
// old at-least-once behaviour beats going silent.
export async function claimInboundMessage(messageId: string, waId: string): Promise<boolean> {
  if (!messageId) return true;
  return safe(
    async () => {
      const rows = await db
        .insert(whatsappProcessedMessages)
        .values({ messageId, waId })
        .onConflictDoNothing({ target: whatsappProcessedMessages.messageId })
        .returning({ messageId: whatsappProcessedMessages.messageId });
      return rows.length > 0;
    },
    true,
    "claimInboundMessage",
  );
}

export type SimpleMessage = { role: "user" | "assistant"; text: string };

// Last N messages (oldest-first) for feeding short-term context to the AI agent.
export async function getRecentMessages(waId: string, limit = 12): Promise<SimpleMessage[]> {
  return safe(
    async () => {
      const rows = await db
        .select()
        .from(whatsappMessages)
        .where(and(eq(whatsappMessages.waId, waId), eq(whatsappMessages.type, "text")))
        .orderBy(desc(whatsappMessages.createdAt))
        .limit(limit);
      return rows
        .reverse()
        .filter((r) => r.body)
        .map((r) => ({
          role: r.direction === "inbound" ? ("user" as const) : ("assistant" as const),
          text: r.body as string,
        }));
    },
    [],
    "getRecentMessages",
  );
}
