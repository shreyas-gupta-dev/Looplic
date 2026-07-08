"use client";

import {
  ArrowLeft, ArrowRight, BadgeIndianRupee, BatteryLow, BellOff, Bluetooth, Camera, Check, CircleAlert, Ear, Fan,
  Fingerprint, HardDrive, Keyboard, Mic, Monitor, Mouse, Package, PlugZap, Power, Radar, Receipt, RotateCcw,
  ScanFace, Smartphone, Truck, Usb, Vibrate, Volume1, Volume2, Wifi,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { computeBuybackQuote, type BuybackOption, type BuybackQuestionRow } from "@/src/lib/buyback/calc";
import type { BuybackVariant } from "@/src/lib/data/buyback";
import { BuybackPickupForm } from "@/src/components/next/BuybackPickupForm";
import { deviceDisplayName } from "@/src/lib/sell";

export type SellEvaluationModel = {
  id: string;
  name: string;
  brandName: string;
  imageUrl: string | null;
  categoryLabel: string;
};

type SellEvaluationFlowProps = {
  model: SellEvaluationModel;
  variants: BuybackVariant[];
  questions: BuybackQuestionRow[];
  optionsByQuestion: Record<string, BuybackOption[]>;
  serviceType?: string;
  soldCount?: number;
};

// A wizard step is either a group of yes/no questions answered on one screen
// (Cashify's "Tell us more about your device?") or a single question screen.
type WizardStep =
  | { kind: "group"; questions: BuybackQuestionRow[] }
  | { kind: "question"; question: BuybackQuestionRow };

function formatInr(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

// Map a defect label to a lucide icon for the Cashify-style tile grids.
function defectIcon(label: string) {
  const l = label.toLowerCase();
  if (/camera/.test(l)) return Camera;
  if (/wi-?fi/.test(l)) return Wifi;
  if (/bluetooth/.test(l)) return Bluetooth;
  if (/battery/.test(l)) return BatteryLow;
  if (/charger|charging/.test(l)) return PlugZap;
  if (/port|usb/.test(l)) return Usb;
  if (/receiver|earpiece|ear /.test(l)) return Ear;
  if (/speaker|sound|audio/.test(l)) return Volume2;
  if (/mic/.test(l)) return Mic;
  if (/power/.test(l)) return Power;
  if (/silent|mute/.test(l)) return BellOff;
  if (/volume/.test(l)) return Volume1;
  if (/finger/.test(l)) return Fingerprint;
  if (/face/.test(l)) return ScanFace;
  if (/vibrat/.test(l)) return Vibrate;
  if (/sensor|proximity/.test(l)) return Radar;
  if (/keyboard|key /.test(l)) return Keyboard;
  if (/trackpad|touchpad/.test(l)) return Mouse;
  if (/fan|heat/.test(l)) return Fan;
  if (/storage|ram|ssd|hard/.test(l)) return HardDrive;
  if (/screen|display|spot|line|discolor|graphics/.test(l)) return Monitor;
  if (/body|panel|dent|frame|hinge|scratch/.test(l)) return Smartphone;
  if (/box/.test(l)) return Package;
  if (/bill|invoice/.test(l)) return Receipt;
  return CircleAlert;
}

function ModelHeader({ model, subtitle }: { model: SellEvaluationModel; subtitle: string }) {
  const [failed, setFailed] = useState(false);
  const imageUrl = typeof model.imageUrl === "string" && model.imageUrl.trim() && !failed ? model.imageUrl.trim() : "";

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3.5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      {imageUrl ? (
        <img src={imageUrl} alt={model.name} className="size-12 object-contain" onError={() => setFailed(true)} />
      ) : (
        <div className="flex size-12 items-center justify-center rounded-xl bg-gray-50">
          <Smartphone className="size-5 text-gray-300" />
        </div>
      )}
      <div className="min-w-0">
        <div className="truncate text-[14px] font-bold text-gray-900">{deviceDisplayName(model.brandName, model.name)}</div>
        <div className="truncate text-[11px] text-gray-500">{subtitle}</div>
      </div>
    </div>
  );
}

export function SellEvaluationFlow({ model, variants, questions, optionsByQuestion, serviceType, soldCount }: SellEvaluationFlowProps) {
  const [stage, setStage] = useState<"teaser" | "questions" | "result">("teaser");
  const [variantId, setVariantId] = useState<string | null>(variants.length === 1 ? variants[0].id : null);
  const [stepIndex, setStepIndex] = useState(0);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [bookingOpen, setBookingOpen] = useState(false);

  // Each step/stage change scrolls back to the top — otherwise the next
  // question opens wherever the previous (taller) screen left the viewport.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [stepIndex, stage]);

  const answerableQuestions = useMemo(
    () => questions.filter((question) => (optionsByQuestion[question.id] ?? []).length > 0),
    [questions, optionsByQuestion],
  );

  // Consecutive runs of 2-option single questions collapse into one grouped
  // yes/no screen; everything else gets its own step.
  const steps = useMemo<WizardStep[]>(() => {
    const built: WizardStep[] = [];
    for (const question of answerableQuestions) {
      const options = optionsByQuestion[question.id] ?? [];
      const isYesNo = question.question_type === "single" && options.length === 2;
      const last = built[built.length - 1];
      if (isYesNo) {
        if (last?.kind === "group") {
          last.questions.push(question);
        } else {
          built.push({ kind: "group", questions: [question] });
        }
      } else {
        built.push({ kind: "question", question });
      }
    }
    return built;
  }, [answerableQuestions, optionsByQuestion]);

  // ── Persist wizard progress to the URL ──────────────────────────────────────
  // The evaluation wizard is entirely client-side, so a sign-in round-trip (the
  // pickup form gates on auth) would otherwise drop the user's variant + answers
  // and reset the quote. Mirror the meaningful state into the URL via
  // replaceState and re-seed from it on mount, so signing in returns the user to
  // the exact quote with the pickup form still open.
  const didRestoreRef = useRef(false);
  const persistMountRef = useRef(false);

  useEffect(() => {
    if (didRestoreRef.current || typeof window === "undefined") return;
    didRestoreRef.current = true;
    const sp = new URLSearchParams(window.location.search);
    const v = sp.get("v");
    if (v && variants.some((variant) => variant.id === v)) setVariantId(v);
    const a = sp.get("a");
    if (a) {
      try {
        const parsed = JSON.parse(a);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          setSelected(parsed as Record<string, string[]>);
        }
      } catch {
        // Ignore a malformed answers param — the user just re-answers.
      }
    }
    const si = Number(sp.get("si"));
    if (Number.isInteger(si) && si >= 0) setStepIndex(si);
    const st = sp.get("st");
    if (st === "questions" || st === "result") setStage(st);
    if (sp.get("bk") === "1") setBookingOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Skip the mount pass so we never wipe the params before restore reads them.
    if (!persistMountRef.current) { persistMountRef.current = true; return; }
    const sp = new URLSearchParams(window.location.search);
    ["v", "st", "si", "a", "bk"].forEach((key) => sp.delete(key));
    if (stage !== "teaser") {
      if (variantId) sp.set("v", variantId);
      sp.set("st", stage);
      if (stage === "questions") sp.set("si", String(stepIndex));
      const answered = Object.fromEntries(Object.entries(selected).filter(([, ids]) => ids.length > 0));
      if (Object.keys(answered).length > 0) sp.set("a", JSON.stringify(answered));
      if (bookingOpen) sp.set("bk", "1");
    }
    const qs = sp.toString();
    const target = window.location.pathname + (qs ? `?${qs}` : "");
    const current = window.location.pathname + window.location.search;
    if (target !== current) window.history.replaceState(window.history.state, "", target);
  }, [stage, variantId, stepIndex, selected, bookingOpen]);

  // A restored step index can land past the end if the question set changed
  // since the URL was written; clamp it so steps[stepIndex] can't be undefined.
  useEffect(() => {
    if (stage === "questions" && steps.length > 0 && stepIndex >= steps.length) {
      setStepIndex(steps.length - 1);
    }
  }, [stage, stepIndex, steps.length]);

  const selectedVariant = variants.find((variant) => variant.id === variantId) ?? null;
  const basePrice = selectedVariant?.basePrice ?? 0;

  const quote = useMemo(
    () => computeBuybackQuote(basePrice, answerableQuestions, optionsByQuestion, selected),
    [basePrice, answerableQuestions, optionsByQuestion, selected],
  );

  const answeredSummary = useMemo(
    () =>
      answerableQuestions
        .map((question) => {
          const options = optionsByQuestion[question.id] ?? [];
          const chosen = (selected[question.id] ?? [])
            .map((id) => options.find((option) => option.id === id)?.label)
            .filter(Boolean) as string[];
          return { question, chosen };
        })
        .filter((entry) => entry.chosen.length > 0),
    [answerableQuestions, optionsByQuestion, selected],
  );

  // ── No pricing configured at all → WhatsApp manual-quote fallback ──────────
  if (variants.length === 0) {
    return (
      <div className="space-y-4">
        <ModelHeader model={model} subtitle={`Sell ${model.categoryLabel}`} />
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <div className="mb-5 text-center">
            <h2 className="text-[16px] font-semibold text-gray-900">Instant quote coming soon for this model</h2>
            <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-gray-500">
              We haven&apos;t priced the {deviceDisplayName(model.brandName, model.name)} online yet — but we still buy it. Leave your
              number and we&apos;ll call you with our best price.
            </p>
          </div>
          <BuybackPickupForm mode="quote" brandName={model.brandName} modelName={model.name} serviceType={serviceType} />
        </div>
      </div>
    );
  }

  const totalSteps = steps.length;

  function isStepComplete(step: WizardStep) {
    if (step.kind === "group") {
      return step.questions.every((question) => (selected[question.id] ?? []).length > 0);
    }
    // Multi questions may legitimately have zero selections ("none apply").
    return true;
  }

  function advance() {
    if (stepIndex + 1 >= totalSteps) {
      setStage("result");
    } else {
      setStepIndex(stepIndex + 1);
    }
  }

  function goBack() {
    if (stage === "result") {
      setStage(totalSteps === 0 ? "teaser" : "questions");
      setStepIndex(Math.max(0, totalSteps - 1));
    } else if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    } else {
      setStage("teaser");
    }
  }

  function restart() {
    setSelected({});
    setStepIndex(0);
    setBookingOpen(false);
    setStage("teaser");
  }

  // ── Stage 1: variant picker + "Get Upto" teaser ─────────────────────────────
  if (stage === "teaser") {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="flex shrink-0 items-center justify-center rounded-2xl bg-gray-50 p-4 sm:size-40">
            {model.imageUrl ? (
              <img src={model.imageUrl} alt={model.name} className="max-h-32 object-contain" />
            ) : (
              <Smartphone className="size-10 text-gray-300" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-[18px] font-semibold text-gray-900">{deviceDisplayName(model.brandName, model.name)}</h2>
            {soldCount ? (
              <p className="mt-1 text-[12px] text-gray-500">
                <span className="font-bold text-teal-500">{soldCount.toLocaleString("en-IN")}+</span> already sold on Looplic
              </p>
            ) : null}

            {variants.length > 1 ? (
              <div className="mt-4 rounded-2xl border border-violet-200 bg-violet-50/40 p-4">
                <div className="mb-3 text-[13px] font-bold text-gray-900">Choose a variant</div>
                <div className="flex flex-wrap gap-2">
                  {variants.map((variant) => {
                    const isSelected = variantId === variant.id;
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => setVariantId(variant.id)}
                        className={`flex items-center gap-2 rounded-xl border-2 bg-white px-4 py-2.5 text-[13px] font-semibold transition-all ${
                          isSelected ? "border-violet-500 text-violet-700" : "border-gray-200 text-gray-700 hover:border-violet-300"
                        }`}
                      >
                        <span
                          className={`flex size-4 items-center justify-center rounded-full border-2 ${
                            isSelected ? "border-violet-500 bg-violet-500" : "border-gray-300 bg-white"
                          }`}
                        >
                          {isSelected ? <Check className="size-2.5 text-white" /> : null}
                        </span>
                        {variant.label || "Standard"}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {selectedVariant ? (
              <div className="mt-4">
                <div className="text-[12px] font-semibold text-gray-500">Get Upto</div>
                <div className="text-[34px] font-extrabold leading-tight text-violet-600">{formatInr(selectedVariant.basePrice)}</div>
                <div className="text-[11px] text-gray-400">Exact value depends on your device&apos;s condition</div>
              </div>
            ) : null}

            <button
              type="button"
              disabled={!selectedVariant}
              onClick={() => setStage(totalSteps === 0 ? "result" : "questions")}
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#4F46E5] to-[#8B3DFF] px-7 py-3 text-[14px] font-bold text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400"
            >
              Get Exact Value <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Stage 3: final quote ────────────────────────────────────────────────────
  if (stage === "result") {
    const variantSuffix = selectedVariant?.label ? ` (${selectedVariant.label})` : "";

    return (
      <div className="space-y-4">
        <ModelHeader model={model} subtitle={`Sell ${model.categoryLabel}${variantSuffix} · Quote ready`} />

        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
          <div className="bg-gradient-to-r from-[#4F46E5] to-[#8B3DFF] px-5 py-6 text-center text-white">
            <div className="text-[11px] font-bold uppercase tracking-widest text-white/70">Your instant quote</div>
            <div className="mt-1 text-[38px] font-extrabold leading-none">{formatInr(quote.finalQuote)}</div>
            <div className="mt-2 text-[11px] text-white/70">Final price confirmed after a quick check at pickup</div>
          </div>

          <div className="p-5">
            {/* The line-by-line deduction breakdown is intentionally NOT shown
                to customers; it's stored with the booking for the admin. */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5">
                <Truck className="size-4 shrink-0 text-emerald-500" />
                <span className="text-[11px] font-semibold text-emerald-700">Free doorstep pickup</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5">
                <BadgeIndianRupee className="size-4 shrink-0 text-emerald-500" />
                <span className="text-[11px] font-semibold text-emerald-700">Same-day UPI payment</span>
              </div>
            </div>

            {bookingOpen ? (
              <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
                <h3 className="mb-3 text-[14px] font-bold text-gray-900">Book your free pickup</h3>
                <BuybackPickupForm
                  mode="pickup"
                  brandName={model.brandName}
                  modelName={model.name}
                  variantLabel={selectedVariant?.label || null}
                  quoteAmount={quote.finalQuote}
                  serviceType={serviceType}
                  quoteBreakdown={[
                    `Base ${formatInr(quote.basePrice)}`,
                    ...quote.lines.map((line) => `${line.questionTitle}: ${line.optionLabel} (${line.impact >= 0 ? "+" : "−"}${formatInr(Math.abs(line.impact))})`),
                    `Final ${formatInr(quote.finalQuote)}`,
                  ].join(" | ")}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setBookingOpen(true)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#4F46E5] to-[#8B3DFF] px-6 py-3.5 text-[14px] font-bold text-white transition-all hover:opacity-90"
              >
                Book Free Pickup <ArrowRight className="size-4" />
              </button>
            )}

            <div className="mt-3 flex items-center justify-center gap-4">
              <button type="button" onClick={restart} className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-gray-500 hover:text-gray-700">
                <RotateCcw className="size-3.5" /> Re-evaluate
              </button>
              <Link href="/sell" className="text-[12px] font-semibold text-gray-500 hover:text-gray-700">
                Sell another device
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Stage 2: question wizard with evaluation sidebar ────────────────────────
  const step = steps[stepIndex];
  const stepComplete = isStepComplete(step);

  function selectSingle(questionId: string, optionId: string) {
    setSelected((prev) => ({ ...prev, [questionId]: [optionId] }));
  }

  function toggleMulti(questionId: string, optionId: string) {
    setSelected((prev) => {
      const current = prev[questionId] ?? [];
      const next = current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId];
      return { ...prev, [questionId]: next };
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      <div className="space-y-4">
        {/* Progress */}
        <div>
          <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-gray-500">
            <span>Step {stepIndex + 1} of {totalSteps}</span>
            <span>{Math.round((stepIndex / Math.max(1, totalSteps)) * 100)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#4F46E5] to-[#8B3DFF] transition-all duration-300"
              style={{ width: `${Math.max(4, (stepIndex / Math.max(1, totalSteps)) * 100)}%` }}
            />
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6">
          {step.kind === "group" ? (
            <>
              <h2 className="text-center text-[18px] font-semibold text-gray-900">Tell us more about your device</h2>
              <p className="mt-1 text-center text-[12px] text-gray-500">Please answer a few questions about your device.</p>

              <div className="mt-6 space-y-6">
                {step.questions.map((question) => {
                  const options = optionsByQuestion[question.id] ?? [];
                  const current = selected[question.id] ?? [];
                  return (
                    <div key={question.id}>
                      <h3 className="text-[14px] font-bold text-gray-900">{question.title}</h3>
                      {question.description ? <p className="mt-0.5 text-[12px] text-gray-500">{question.description}</p> : null}
                      <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:max-w-sm">
                        {options.map((option) => {
                          const isSelected = current.includes(option.id);
                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => selectSingle(question.id, option.id)}
                              className={`flex items-center gap-2.5 rounded-xl border-2 px-3.5 py-2.5 text-left transition-all ${
                                isSelected ? "border-violet-500 bg-violet-50" : "border-gray-200 bg-white hover:border-violet-200"
                              }`}
                            >
                              <span
                                className={`flex size-4 shrink-0 items-center justify-center rounded-full border-2 ${
                                  isSelected ? "border-violet-500 bg-violet-500" : "border-gray-300 bg-white"
                                }`}
                              >
                                {isSelected ? <Check className="size-2.5 text-white" /> : null}
                              </span>
                              <span className="text-[13px] font-semibold text-gray-900">{option.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : step.question.question_type === "multi" ? (
            <>
              <h2 className="text-center text-[18px] font-semibold text-gray-900">{step.question.title}</h2>
              <p className="mt-1 text-center text-[12px] text-gray-500">
                {step.question.description || "Select everything that applies — skip if none do."}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
                {(optionsByQuestion[step.question.id] ?? []).map((option) => {
                  const isSelected = (selected[step.question.id] ?? []).includes(option.id);
                  const Icon = defectIcon(option.label);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleMulti(step.question.id, option.id)}
                      title={option.description || undefined}
                      className={`relative flex flex-col items-center gap-3 rounded-2xl border-2 p-4 text-center transition-all ${
                        isSelected ? "border-violet-500 bg-violet-50" : "border-gray-200 bg-white hover:border-violet-200"
                      }`}
                    >
                      {isSelected ? (
                        <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-violet-500">
                          <Check className="size-3 text-white" />
                        </span>
                      ) : null}
                      <span className={`flex size-12 items-center justify-center rounded-2xl ${isSelected ? "bg-violet-100" : "bg-gray-50"}`}>
                        <Icon className={`size-6 ${isSelected ? "text-violet-600" : "text-gray-400"}`} />
                      </span>
                      <span className="text-[12px] font-semibold leading-snug text-gray-800">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <h2 className="text-[17px] font-semibold leading-snug text-gray-900">{step.question.title}</h2>
              {step.question.description ? (
                <p className="mt-1 text-[12px] leading-relaxed text-gray-500">{step.question.description}</p>
              ) : null}

              <div className="mt-4 space-y-2.5">
                {(optionsByQuestion[step.question.id] ?? []).map((option) => {
                  const isSelected = (selected[step.question.id] ?? []).includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => selectSingle(step.question.id, option.id)}
                      className={`flex w-full items-center gap-3 rounded-2xl border-2 p-3.5 text-left transition-all ${
                        isSelected ? "border-violet-500 bg-violet-50" : "border-gray-100 bg-white hover:border-violet-200 hover:bg-gray-50"
                      }`}
                    >
                      <span
                        className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${
                          isSelected ? "border-violet-500 bg-violet-500" : "border-gray-300 bg-white"
                        }`}
                      >
                        {isSelected ? <Check className="size-3 text-white" /> : null}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[13px] font-semibold text-gray-900">{option.label}</span>
                        {option.description ? (
                          <span className="mt-0.5 block text-[11px] leading-snug text-gray-500">{option.description}</span>
                        ) : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-gray-500 transition-colors hover:text-gray-700"
            >
              <ArrowLeft className="size-3.5" /> Back
            </button>

            <button
              type="button"
              disabled={!stepComplete}
              onClick={advance}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#4F46E5] to-[#8B3DFF] px-7 py-2.5 text-[13px] font-bold text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400"
            >
              Continue <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Device Evaluation sidebar */}
      <aside className="hidden lg:block">
        <div className="sticky top-20 space-y-4">
          <ModelHeader
            model={model}
            subtitle={selectedVariant?.label ? `${selectedVariant.label} · Get Upto ${formatInr(basePrice)}` : `Get Upto ${formatInr(basePrice)}`}
          />
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
            <h3 className="text-[14px] font-bold text-gray-900">Device Evaluation</h3>
            {answeredSummary.length === 0 ? (
              <p className="mt-2 text-[12px] text-gray-400">Your answers will appear here as you go.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {answeredSummary.map(({ question, chosen }) => (
                  <div key={question.id}>
                    <div className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{question.title}</div>
                    <ul className="mt-1 space-y-1">
                      {chosen.map((label) => (
                        <li key={label} className="flex items-start gap-1.5 text-[12px] text-gray-700">
                          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-400" />
                          {label}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
