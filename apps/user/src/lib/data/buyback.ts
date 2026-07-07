import { unstable_cache } from "next/cache";
import { and, asc, eq, inArray } from "drizzle-orm";

import { db } from "@/src/lib/db";
import { buybackModelPrices, buybackQuestionOptions, buybackQuestions } from "@/src/lib/db/schema";
import type { BuybackEffectType, BuybackOption, BuybackQuestionRow } from "@/src/lib/buyback/calc";

export type BuybackServiceType = "mobile" | "laptop" | "tablet" | "smartwatch" | "audio";

export type BuybackQuestionSet = {
  questions: BuybackQuestionRow[];
  optionsByQuestion: Record<string, BuybackOption[]>;
};

export const BUYBACK_REVALIDATE_SECONDS = 300;

// Active evaluation questions (with options) for a device category, in admin
// sort order. Throws on DB failure so ISR keeps serving the last good page
// instead of caching an empty questionnaire (same convention as catalog.ts).
export const getBuybackQuestionSet = unstable_cache(
  async (serviceType: BuybackServiceType): Promise<BuybackQuestionSet> => {
    const questionRows = await db
      .select()
      .from(buybackQuestions)
      .where(and(eq(buybackQuestions.serviceType, serviceType), eq(buybackQuestions.active, true)))
      .orderBy(asc(buybackQuestions.sortOrder), asc(buybackQuestions.createdAt));

    const questions: BuybackQuestionRow[] = questionRows.map((row) => ({
      id: row.id,
      service_type: row.serviceType,
      title: row.title,
      description: row.description,
      question_type: row.questionType === "multi" ? "multi" : "single",
      sort_order: row.sortOrder,
      active: row.active,
    }));

    if (questions.length === 0) {
      return { questions: [], optionsByQuestion: {} };
    }

    const optionRows = await db
      .select()
      .from(buybackQuestionOptions)
      .where(inArray(buybackQuestionOptions.questionId, questions.map((q) => q.id)))
      .orderBy(asc(buybackQuestionOptions.sortOrder), asc(buybackQuestionOptions.createdAt));

    const optionsByQuestion: Record<string, BuybackOption[]> = {};
    for (const row of optionRows) {
      const option: BuybackOption = {
        id: row.id,
        question_id: row.questionId,
        label: row.label,
        description: row.description,
        effect_type: row.effectType as BuybackEffectType,
        amount: Number(row.amount) || 0,
        sort_order: row.sortOrder,
      };
      (optionsByQuestion[row.questionId] ??= []).push(option);
    }

    return { questions, optionsByQuestion };
  },
  ["buyback-question-set"],
  { revalidate: BUYBACK_REVALIDATE_SECONDS, tags: ["buyback"] },
);

// Perfect-condition base price for a model, or null when the model has no
// active buyback price configured (the sell flow then shows a callback CTA
// instead of a quote). Throws on DB failure — see getBuybackQuestionSet.
export const getBuybackBasePrice = unstable_cache(
  async (modelId: string): Promise<number | null> => {
    const rows = await db
      .select()
      .from(buybackModelPrices)
      .where(eq(buybackModelPrices.modelId, modelId))
      .limit(1);

    const row = rows[0];
    if (!row || !row.active) return null;

    const price = Number(row.basePrice);
    return Number.isFinite(price) && price > 0 ? price : null;
  },
  ["buyback-base-price"],
  { revalidate: BUYBACK_REVALIDATE_SECONDS, tags: ["buyback"] },
);
