// Buyback quote calculation.
//
// Modeled on how the major buyback/trade-in platforms (Cashify, Gazelle,
// ItsWorthMore, Decluttr, Swappa, BackMarket) price used devices:
//
//   1. Every model has a BASE PRICE — what the device is worth in perfect,
//      fully-working condition (typically 50-60% of retail for a ~1-year-old
//      flagship, 20-30% at 3 years).
//   2. Percentage effects COMPOUND on the running value, not the base price.
//      A dead phone (-60%) that is also cracked (-35%) is worth
//      base × 0.40 × 0.65, not base − 95%. This is what keeps heavily
//      damaged devices from going to zero (they still have parts value) and
//      is how every platform we studied behaves.
//   3. Fixed ₹ effects apply AFTER all percentages — accessories (box,
//      charger, bill) add flat amounts; a missing part deducts a flat amount.
//      They are worth the same regardless of device condition.
//   4. The result is floored at 0 and rounded to the nearest ₹10.
//
// Question order matters for display, not for math: percentage compounding is
// commutative, so admins can reorder questions freely.

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

export function questionMatchesSegment(question: BuybackQuestionRow, segment: Exclude<BuybackOsSegment, "all">): boolean {
  const scope = question.os_segment || "all";
  return scope === "all" || scope === segment;
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

export function formatEffect(effectType: BuybackEffectType, amount: number): string {
  const n = Number(amount) || 0;
  switch (effectType) {
    case "deduct_fixed": return `-₹${n.toLocaleString("en-IN")}`;
    case "deduct_percent": return `-${n}%`;
    case "add_fixed": return `+₹${n.toLocaleString("en-IN")}`;
    case "add_percent": return `+${n}%`;
  }
}

export const EFFECT_LABELS: Record<BuybackEffectType, { label: string; helper: string }> = {
  deduct_fixed: { label: "Deduct ₹ (fixed)", helper: "Subtracts a flat amount" },
  deduct_percent: { label: "Deduct % of value", helper: "Cuts the running quote by this percent (compounds with other % cuts)" },
  add_fixed: { label: "Add ₹ (fixed)", helper: "Adds a flat amount (e.g. original box / charger / bill)" },
  add_percent: { label: "Add % of value", helper: "Increases the running quote by this percent" },
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
