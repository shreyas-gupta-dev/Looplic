"use client";

import { ArrowLeft, ArrowRight, BadgeIndianRupee, Check, ChevronDown, MessageCircle, RotateCcw, Smartphone, Truck } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { computeBuybackQuote, type BuybackOption, type BuybackQuestionRow } from "@/src/lib/buyback/calc";
import { whatsappPhone } from "@/src/lib/company";

export type SellEvaluationModel = {
  id: string;
  name: string;
  brandName: string;
  imageUrl: string | null;
  categoryLabel: string;
};

type SellEvaluationFlowProps = {
  model: SellEvaluationModel;
  basePrice: number | null;
  questions: BuybackQuestionRow[];
  optionsByQuestion: Record<string, BuybackOption[]>;
};

function formatInr(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
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
        <div className="truncate text-[14px] font-bold text-gray-900">{model.brandName} {model.name}</div>
        <div className="truncate text-[11px] text-gray-500">{subtitle}</div>
      </div>
    </div>
  );
}

export function SellEvaluationFlow({ model, basePrice, questions, optionsByQuestion }: SellEvaluationFlowProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [showResult, setShowResult] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const answerableQuestions = useMemo(
    () => questions.filter((question) => (optionsByQuestion[question.id] ?? []).length > 0),
    [questions, optionsByQuestion],
  );

  const quote = useMemo(
    () => computeBuybackQuote(basePrice ?? 0, answerableQuestions, optionsByQuestion, selected),
    [basePrice, answerableQuestions, optionsByQuestion, selected],
  );

  // No price configured for this model yet — offer a manual quote instead.
  if (basePrice === null) {
    return (
      <div className="space-y-4">
        <ModelHeader model={model} subtitle={`Sell ${model.categoryLabel}`} />
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <h2 className="text-[16px] font-semibold text-gray-900">Instant quote coming soon for this model</h2>
          <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-gray-500">
            We haven&apos;t priced the {model.brandName} {model.name} online yet — but we still buy it. Message us and
            we&apos;ll quote it personally within a few minutes.
          </p>
          <a
            href={`https://wa.me/91${whatsappPhone}?text=${encodeURIComponent(`Hi! I want to sell my ${model.brandName} ${model.name}. Can you give me a quote?`)}`}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#4F46E5] to-[#8B3DFF] px-6 py-3 text-[13px] font-bold text-white transition-all hover:opacity-90"
          >
            <MessageCircle className="size-4" /> Get a quote on WhatsApp
          </a>
        </div>
      </div>
    );
  }

  const totalSteps = answerableQuestions.length;
  const done = showResult || totalSteps === 0;
  const currentQuestion = !done ? answerableQuestions[stepIndex] : null;

  function selectSingle(questionId: string, optionId: string) {
    setSelected((prev) => ({ ...prev, [questionId]: [optionId] }));
    if (stepIndex + 1 >= totalSteps) {
      setShowResult(true);
    } else {
      setStepIndex(stepIndex + 1);
    }
  }

  function toggleMulti(questionId: string, optionId: string) {
    setSelected((prev) => {
      const current = prev[questionId] ?? [];
      const next = current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId];
      return { ...prev, [questionId]: next };
    });
  }

  function continueMulti() {
    if (stepIndex + 1 >= totalSteps) {
      setShowResult(true);
    } else {
      setStepIndex(stepIndex + 1);
    }
  }

  function goBack() {
    if (showResult) {
      setShowResult(false);
      setStepIndex(Math.max(0, totalSteps - 1));
    } else if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    }
  }

  function restart() {
    setSelected({});
    setStepIndex(0);
    setShowResult(false);
    setShowBreakdown(false);
  }

  if (done) {
    const whatsappMessage =
      `Hi! I'd like to sell my ${model.brandName} ${model.name}. ` +
      `Your website quoted me ${formatInr(quote.finalQuote)}. Please book my free doorstep pickup.`;

    return (
      <div className="space-y-4">
        <ModelHeader model={model} subtitle={`Sell ${model.categoryLabel} · Quote ready`} />

        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
          <div className="bg-gradient-to-r from-[#4F46E5] to-[#8B3DFF] px-5 py-6 text-center text-white">
            <div className="text-[11px] font-bold uppercase tracking-widest text-white/70">Your instant quote</div>
            <div className="mt-1 text-[38px] font-extrabold leading-none">{formatInr(quote.finalQuote)}</div>
            <div className="mt-2 text-[11px] text-white/70">Final price confirmed after a quick check at pickup</div>
          </div>

          <div className="p-5">
            <button
              type="button"
              onClick={() => setShowBreakdown((open) => !open)}
              className="flex w-full items-center justify-between rounded-xl bg-gray-50 px-4 py-3 text-left"
            >
              <span className="text-[12px] font-bold text-gray-700">How we calculated this</span>
              <ChevronDown className={`size-4 text-gray-400 transition-transform ${showBreakdown ? "rotate-180" : ""}`} />
            </button>

            {showBreakdown ? (
              <div className="mt-3 space-y-2 px-1">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-gray-500">Perfect-condition value</span>
                  <span className="font-bold text-gray-900">{formatInr(quote.basePrice)}</span>
                </div>
                {quote.lines.length === 0 ? (
                  <p className="text-[11px] text-gray-400">No adjustments — your device is in top shape!</p>
                ) : (
                  quote.lines.map((line) => (
                    <div key={line.optionId} className="flex items-center justify-between gap-3 text-[12px]">
                      <span className="min-w-0 truncate text-gray-500">{line.questionTitle}: {line.optionLabel}</span>
                      <span className={`shrink-0 font-bold ${line.impact >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                        {line.impact >= 0 ? "+" : "−"}{formatInr(Math.abs(line.impact))}
                      </span>
                    </div>
                  ))
                )}
                <div className="flex items-center justify-between border-t border-gray-100 pt-2 text-[13px]">
                  <span className="font-bold text-gray-900">Final quote</span>
                  <span className="font-extrabold text-violet-600">{formatInr(quote.finalQuote)}</span>
                </div>
              </div>
            ) : null}

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5">
                <Truck className="size-4 shrink-0 text-emerald-500" />
                <span className="text-[11px] font-semibold text-emerald-700">Free doorstep pickup</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5">
                <BadgeIndianRupee className="size-4 shrink-0 text-emerald-500" />
                <span className="text-[11px] font-semibold text-emerald-700">Same-day UPI payment</span>
              </div>
            </div>

            <a
              href={`https://wa.me/91${whatsappPhone}?text=${encodeURIComponent(whatsappMessage)}`}
              target="_blank"
              rel="noreferrer"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#4F46E5] to-[#8B3DFF] px-6 py-3.5 text-[14px] font-bold text-white transition-all hover:opacity-90"
            >
              Book Free Pickup <ArrowRight className="size-4" />
            </a>

            <div className="mt-3 flex items-center justify-center gap-4">
              {totalSteps > 0 ? (
                <button type="button" onClick={restart} className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-gray-500 hover:text-gray-700">
                  <RotateCcw className="size-3.5" /> Re-evaluate
                </button>
              ) : null}
              <Link href="/sell" className="text-[12px] font-semibold text-gray-500 hover:text-gray-700">
                Sell another device
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const question = currentQuestion!;
  const options = optionsByQuestion[question.id] ?? [];
  const currentSelection = selected[question.id] ?? [];
  const isMulti = question.question_type === "multi";

  return (
    <div className="space-y-4">
      <ModelHeader model={model} subtitle={`Sell ${model.categoryLabel} · Answer ${totalSteps} quick question${totalSteps === 1 ? "" : "s"}`} />

      {/* Progress */}
      <div>
        <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-gray-500">
          <span>Question {stepIndex + 1} of {totalSteps}</span>
          <span>{Math.round((stepIndex / totalSteps) * 100)}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#4F46E5] to-[#8B3DFF] transition-all duration-300"
            style={{ width: `${Math.max(4, (stepIndex / totalSteps) * 100)}%` }}
          />
        </div>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        <h2 className="text-[17px] font-semibold leading-snug text-gray-900">{question.title}</h2>
        {question.description ? <p className="mt-1 text-[12px] leading-relaxed text-gray-500">{question.description}</p> : null}
        {isMulti ? <p className="mt-1 text-[11px] font-semibold text-violet-500">Select all that apply — skip if none do.</p> : null}

        <div className="mt-4 space-y-2.5">
          {options.map((option) => {
            const isSelected = currentSelection.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => (isMulti ? toggleMulti(question.id, option.id) : selectSingle(question.id, option.id))}
                className={`flex w-full items-center gap-3 rounded-2xl border-2 p-3.5 text-left transition-all ${
                  isSelected ? "border-violet-500 bg-violet-50" : "border-gray-100 bg-white hover:border-violet-200 hover:bg-gray-50"
                }`}
              >
                <span
                  className={`flex size-5 shrink-0 items-center justify-center border-2 ${isMulti ? "rounded-md" : "rounded-full"} ${
                    isSelected ? "border-violet-500 bg-violet-500" : "border-gray-300 bg-white"
                  }`}
                >
                  {isSelected ? <Check className="size-3 text-white" /> : null}
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold text-gray-900">{option.label}</span>
                  {option.description ? <span className="mt-0.5 block text-[11px] leading-snug text-gray-500">{option.description}</span> : null}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <button
            type="button"
            onClick={goBack}
            disabled={stepIndex === 0}
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-gray-500 transition-colors hover:text-gray-700 disabled:invisible"
          >
            <ArrowLeft className="size-3.5" /> Back
          </button>

          {isMulti ? (
            <button
              type="button"
              onClick={continueMulti}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#4F46E5] to-[#8B3DFF] px-6 py-2.5 text-[13px] font-bold text-white transition-all hover:opacity-90"
            >
              {currentSelection.length === 0 ? "None apply — Continue" : "Continue"} <ArrowRight className="size-3.5" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
