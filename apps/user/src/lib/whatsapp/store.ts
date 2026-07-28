import { and, desc, eq } from "drizzle-orm";

import { db } from "@/src/lib/db";
import { whatsappConversations, whatsappMessages } from "@/src/lib/db/schema";
import type { WhatsappConversation } from "@/src/lib/db/schema";

// Persistence for the WhatsApp bot. Everything here is BEST-EFFORT: if the
// migration (whatsapp_conversations / whatsapp_messages) hasn't been run yet we
// swallow the "relation does not exist" error (42P01) so the bot keeps replying
// — it just loses conversation memory until the tables exist.

function isMissingTable(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string } };
  return (e?.code ?? e?.cause?.code) === "42P01";
}

async function safe<T>(fn: () => Promise<T>, fallback: T, context: string): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (isMissingTable(err)) return fallback;
    console.error(`[whatsapp:store:${context}] ${err instanceof Error ? err.message : err}`);
    return fallback;
  }
}

export type ConversationState = "new" | "menu" | "ai" | "handoff";

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
