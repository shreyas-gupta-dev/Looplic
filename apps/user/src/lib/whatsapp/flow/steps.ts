import type { FlowContext, FlowStep } from "./types";

// The pure core of the wizard: step ordering, back/forward navigation, context
// invalidation, pagination and date parsing. Deliberately free of any Next.js,
// database or network import so it can be unit-tested with `node --test`
// (see __tests__/steps.test.ts) — machine.ts adds the I/O around it.

// A WhatsApp list holds ten rows total; two are spent on navigation.
export const PAGE_SIZE = 8;

export type Page<T> = {
  items: T[];
  page: number;
  pageCount: number;
  hasMore: boolean;
  total: number;
};

export function paginate<T>(items: T[], page: number): Page<T> {
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(Math.max(0, page), pageCount - 1);
  const start = safePage * PAGE_SIZE;
  return {
    items: items.slice(start, start + PAGE_SIZE),
    page: safePage,
    pageCount,
    hasMore: start + PAGE_SIZE < total,
    total,
  };
}

// The ordered steps for the customer's chosen journey, with conditional steps
// (laptop specs, sell variants/questions) filtered out when they don't apply.
// `nextStep`/`prevStep` both read from this, so Back is always the exact inverse
// of Continue — the guarantee the website's getPreviousStep() gives.
export function sequenceFor(context: FlowContext): FlowStep[] {
  const details: FlowStep[] = ["name", "phone", "address", "city", "pincode", "date", "slot", "confirm"];

  switch (context.kind) {
    case "repair": {
      const laptop: FlowStep[] =
        context.dbServiceType === "laptop_repair" ? ["laptop_ram", "laptop_storage", "laptop_os"] : [];
      return ["brand", "series", "model", "repair_category", "repair_service", ...laptop, "notes", ...details];
    }
    case "guard":
      return ["brand", "series", "model", "guard", "notes", ...details];
    case "cctv":
      return ["cctv_service", "cctv_brand", "cctv_cameras", "cctv_location", "cctv_dvr", "notes", ...details];
    case "sell": {
      const priced = context.sellPriced === false ? [] : (["sell_variant", "sell_question", "sell_quote"] as FlowStep[]);
      return ["sell_category", "brand", "series", "model", ...priced, ...details];
    }
    case "simple":
      return ["notes", ...details];
    case "track":
      return ["track_code", "manage_booking"];
    default:
      return ["service", ...details];
  }
}

export function nextStep(step: FlowStep, context: FlowContext): FlowStep {
  // Editing one answer from the confirm screen returns straight to confirm.
  if (context.editing) return "confirm";
  const sequence = sequenceFor(context);
  const index = sequence.indexOf(step);
  if (index === -1) return sequence[0] ?? "confirm";
  return sequence[index + 1] ?? "confirm";
}

export function prevStep(step: FlowStep, context: FlowContext): FlowStep | null {
  const sequence = sequenceFor(context);
  const index = sequence.indexOf(step);
  if (index <= 0) return null;
  return sequence[index - 1];
}

// Re-answering a step must invalidate everything derived from it — picking a
// different brand can't leave the previous model's repair price behind.
export function clearDownstream(step: FlowStep, context: FlowContext): FlowContext {
  const next = { ...context };
  const clearDevice = () => {
    delete next.repairCategoryId;
    delete next.repairCategoryName;
    delete next.repairSubcategoryId;
    delete next.repairSubcategoryName;
    delete next.price;
    delete next.priceVisible;
    delete next.guardType;
    delete next.guardPrice;
    delete next.sellVariantId;
    delete next.sellVariantLabel;
    delete next.sellAnswers;
    delete next.sellQuestionIndex;
    delete next.sellQuote;
    delete next.sellBasePrice;
    delete next.sellPriced;
  };

  switch (step) {
    case "service":
    case "sell_category":
      delete next.brandId;
      delete next.brandName;
    // falls through — a new brand invalidates the series too
    case "brand":
      delete next.seriesId;
      delete next.seriesName;
    // falls through
    case "series":
      delete next.modelId;
      delete next.modelName;
    // falls through
    case "model":
      clearDevice();
      break;
    case "repair_category":
      delete next.repairSubcategoryId;
      delete next.repairSubcategoryName;
      delete next.price;
      delete next.priceVisible;
      break;
    case "sell_variant":
      delete next.sellAnswers;
      delete next.sellQuestionIndex;
      delete next.sellQuote;
      break;
    default:
      break;
  }
  return next;
}

// Accepts "2 Aug", "02/08", "2026-08-02", "today" and "tomorrow". Returns an ISO
// date string, or null when it can't be read confidently (the caller then
// re-renders the date picker rather than guessing).
export function parseTypedDate(input: string, now = new Date()): string | null {
  const value = String(input || "").trim().toLowerCase();
  const iso = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  if (!value) return null;
  if (value === "today") return iso(now);
  if (value === "tomorrow") {
    const date = new Date(now);
    date.setDate(date.getDate() + 1);
    return iso(date);
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : value;
  }

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

  const named = value.match(/^(\d{1,2})\s*(?:st|nd|rd|th)?\s+([a-z]{3,})/);
  if (named) {
    const monthIndex = months.indexOf(named[2].slice(0, 3));
    if (monthIndex >= 0) {
      const day = Number(named[1]);
      const candidate = new Date(now.getFullYear(), monthIndex, day);
      if (candidate.getMonth() !== monthIndex) return null; // e.g. 31 Feb
      // A date that already passed means they mean next year.
      if (candidate.getTime() < startOfToday) candidate.setFullYear(now.getFullYear() + 1);
      return iso(candidate);
    }
  }

  const numeric = value.match(/^(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?$/);
  if (numeric) {
    const day = Number(numeric[1]);
    const month = Number(numeric[2]) - 1;
    const year = numeric[3] ? Number(numeric[3].length === 2 ? `20${numeric[3]}` : numeric[3]) : now.getFullYear();
    const candidate = new Date(year, month, day);
    if (Number.isNaN(candidate.getTime()) || candidate.getMonth() !== month) return null;
    if (!numeric[3] && candidate.getTime() < startOfToday) candidate.setFullYear(year + 1);
    return iso(candidate);
  }

  return null;
}
