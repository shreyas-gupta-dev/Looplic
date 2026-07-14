// Buyback quote calculation — mirror of apps/admin/src/lib/buyback/calc.ts so
// the customer-facing sell flow computes exactly the same quote the admin
// preview shows. Keep the two files in sync when the pricing model changes.
//
//   1. Every model has a BASE PRICE — what the device is worth in perfect,
//      fully-working condition.
//   2. Percentage effects COMPOUND on the running value, not the base price.
//   3. Fixed ₹ effects apply AFTER all percentages.
//   4. The result is floored at 0 and rounded to the nearest ₹10.

export type BuybackEffectType = "deduct_fixed" | "deduct_percent" | "add_fixed" | "add_percent";

export type BuybackOption = {
  id: string;
  question_id: string;
  label: string;
  description?: string | null;
  effect_type: BuybackEffectType;
  amount: number; // ₹ for fixed, 0-100 for percent
  sort_order: number;
};

export type BuybackOsSegment = "all" | "apple" | "android";

export type BuybackQuestionRow = {
  id: string;
  service_type: string;
  /** 'all' = every brand; 'apple' / 'android' scope the question to that segment. Optional so rows predating the os_segment migration still type-check. */
  os_segment?: string | null;
  title: string;
  description?: string | null;
  question_type: "single" | "multi";
  sort_order: number;
  active: boolean;
};

// Which segment a brand's devices evaluate under: Apple is its own segment,
// every other brand falls in the Android/other bucket.
export function brandOsSegment(brandName: string): Exclude<BuybackOsSegment, "all"> {
  return brandName.trim().toLowerCase() === "apple" ? "apple" : "android";
}

export type QuoteLine = {
  optionId: string;
  questionTitle: string;
  optionLabel: string;
  effectType: BuybackEffectType;
  amount: number;
  /** Signed ₹ impact this option had on the quote (negative = deduction). */
  impact: number;
};

export type QuoteResult = {
  basePrice: number;
  finalQuote: number;
  lines: QuoteLine[];
};

/**
 * Compute a buyback quote.
 * @param basePrice   perfect-condition price for the model
 * @param questions   active questions (any order)
 * @param optionsByQuestion  options keyed by question id
 * @param selected    question id -> selected option id(s)
 */
export function computeBuybackQuote(
  basePrice: number,
  questions: BuybackQuestionRow[],
  optionsByQuestion: Record<string, BuybackOption[]>,
  selected: Record<string, string[]>,
): QuoteResult {
  const base = Number(basePrice) || 0;
  const lines: QuoteLine[] = [];

  const chosen: Array<{ q: BuybackQuestionRow; o: BuybackOption }> = [];
  for (const q of questions) {
    const ids = selected[q.id] || [];
    const opts = optionsByQuestion[q.id] || [];
    for (const id of ids) {
      const o = opts.find((x) => x.id === id);
      if (o) chosen.push({ q, o });
    }
  }

  // Pass 1: percentage effects compound on the running value.
  let value = base;
  for (const { q, o } of chosen) {
    const amt = Number(o.amount) || 0;
    if (o.effect_type === "deduct_percent") {
      const impact = -value * (Math.min(amt, 100) / 100);
      value += impact;
      lines.push({ optionId: o.id, questionTitle: q.title, optionLabel: o.label, effectType: o.effect_type, amount: amt, impact: Math.round(impact) });
    } else if (o.effect_type === "add_percent") {
      const impact = value * (amt / 100);
      value += impact;
      lines.push({ optionId: o.id, questionTitle: q.title, optionLabel: o.label, effectType: o.effect_type, amount: amt, impact: Math.round(impact) });
    }
  }

  // Pass 2: fixed ₹ effects apply after all percentages.
  for (const { q, o } of chosen) {
    const amt = Number(o.amount) || 0;
    if (o.effect_type === "deduct_fixed") {
      value -= amt;
      lines.push({ optionId: o.id, questionTitle: q.title, optionLabel: o.label, effectType: o.effect_type, amount: amt, impact: -Math.round(amt) });
    } else if (o.effect_type === "add_fixed") {
      value += amt;
      lines.push({ optionId: o.id, questionTitle: q.title, optionLabel: o.label, effectType: o.effect_type, amount: amt, impact: Math.round(amt) });
    }
  }

  // Floor at zero, round to the nearest ₹10 like the marketplaces do.
  const finalQuote = Math.max(0, Math.round(value / 10) * 10);
  return { basePrice: base, finalQuote, lines };
}
