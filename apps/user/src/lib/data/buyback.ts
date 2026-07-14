import { unstable_cache } from "next/cache";
import { and, asc, eq, inArray } from "drizzle-orm";

import { db } from "@/src/lib/db";
import { buybackModelPrices, buybackModelVariants, buybackQuestionOptions, buybackQuestions } from "@/src/lib/db/schema";
import type { BuybackEffectType, BuybackOption, BuybackOsSegment, BuybackQuestionRow } from "@/src/lib/buyback/calc";

export type BuybackServiceType = "mobile" | "laptop" | "tablet" | "smartwatch" | "audio";

export type BuybackQuestionSet = {
  questions: BuybackQuestionRow[];
  optionsByQuestion: Record<string, BuybackOption[]>;
};

export const BUYBACK_REVALIDATE_SECONDS = 300;

// Active evaluation questions (with options) for a device category and OS
// segment (Apple vs Android/other — 'all'-scoped questions apply to both), in
// admin sort order. Throws on DB failure so ISR keeps serving the last good
// page instead of caching an empty questionnaire (same convention as
// catalog.ts).
export const getBuybackQuestionSet = unstable_cache(
  async (serviceType: BuybackServiceType, osSegment: Exclude<BuybackOsSegment, "all">): Promise<BuybackQuestionSet> => {
    type QuestionSelect = {
      id: string; serviceType: string; osSegment: string; title: string;
      description: string | null; questionType: string; sortOrder: number; active: boolean;
    };
    let questionRows: QuestionSelect[];
    try {
      questionRows = await db
        .select()
        .from(buybackQuestions)
        .where(and(
          eq(buybackQuestions.serviceType, serviceType),
          eq(buybackQuestions.active, true),
          inArray(buybackQuestions.osSegment, ["all", osSegment]),
        ))
        .orderBy(asc(buybackQuestions.sortOrder), asc(buybackQuestions.createdAt));
    } catch (err) {
      // 42703 = undefined_column: the os_segment migration hasn't run yet.
      // Degrade to the unsegmented question set (everything applies to every
      // brand, the pre-segment behaviour); any other DB failure still throws.
      const e = err as { code?: string; cause?: { code?: string } };
      const code = e?.code ?? e?.cause?.code;
      if (code !== "42703") throw err;
      const legacyRows = await db
        .select({
          id: buybackQuestions.id,
          serviceType: buybackQuestions.serviceType,
          title: buybackQuestions.title,
          description: buybackQuestions.description,
          questionType: buybackQuestions.questionType,
          sortOrder: buybackQuestions.sortOrder,
          active: buybackQuestions.active,
        })
        .from(buybackQuestions)
        .where(and(eq(buybackQuestions.serviceType, serviceType), eq(buybackQuestions.active, true)))
        .orderBy(asc(buybackQuestions.sortOrder), asc(buybackQuestions.createdAt));
      questionRows = legacyRows.map((row) => ({ ...row, osSegment: "all" }));
    }

    const questions: BuybackQuestionRow[] = questionRows.map((row) => ({
      id: row.id,
      service_type: row.serviceType,
      os_segment: row.osSegment,
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

export type BuybackVariant = {
  id: string;
  label: string;
  basePrice: number;
};

// Storage/spec variants for a model, each with its own base price. Falls back
// to the flat buyback_model_prices row (as a single unlabelled variant) when
// no variant rows exist, and [] when the model has no pricing at all — the
// sell flow then shows the WhatsApp manual-quote fallback.
export const getBuybackVariants = unstable_cache(
  async (modelId: string): Promise<BuybackVariant[]> => {
    let variantRows: Array<typeof buybackModelVariants.$inferSelect> = [];
    try {
      variantRows = await db
        .select()
        .from(buybackModelVariants)
        .where(and(eq(buybackModelVariants.modelId, modelId), eq(buybackModelVariants.active, true)))
        .orderBy(asc(buybackModelVariants.sortOrder), asc(buybackModelVariants.createdAt));
    } catch (err) {
      // 42P01 = undefined_table: the variants migration hasn't been run yet.
      // Degrade to the flat model price instead of breaking the page; any
      // other DB failure still throws (ISR keeps serving the last good page).
      const e = err as { code?: string; cause?: { code?: string } };
      const code = e?.code ?? e?.cause?.code;
      if (code !== "42P01") throw err;
    }

    const variants = variantRows
      .map((row) => ({ id: row.id, label: row.variantLabel, basePrice: Number(row.basePrice) }))
      .filter((variant) => Number.isFinite(variant.basePrice) && variant.basePrice > 0);

    if (variants.length > 0) return variants;

    const flatPrice = await getBuybackBasePrice(modelId);
    return flatPrice === null ? [] : [{ id: "base", label: "", basePrice: flatPrice }];
  },
  ["buyback-variants"],
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
