"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/src/lib/data-client/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import {
  Plus, Trash2, Pencil, Loader2, X, Check, Smartphone, Laptop, ChevronDown, ChevronUp, IndianRupee, Calculator, ListChecks, Search,
} from "lucide-react";
import {
  BuybackEffectType, BuybackOption, BuybackQuestionRow, EFFECT_LABELS, computeBuybackQuote, formatEffect,
} from "@/src/lib/buyback/calc";

const dataClient = new Proxy({} as any, {
  get(_target, property) {
    return (createClient() as any)[property];
  },
});

type Brand = { id: string; name: string; sort_order: number; service_type: string };
type Series = { id: string; brand_id: string; name: string };
type Model = { id: string; series_id: string; name: string };
type ModelPrice = { id: string; model_id: string; base_price: number; active: boolean };
type ServiceType = "mobile" | "laptop";

const EFFECT_TYPES: BuybackEffectType[] = ["deduct_fixed", "deduct_percent", "add_fixed", "add_percent"];

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary";
const selectClass = inputClass + " appearance-none";
const primaryBtn =
  "inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50";
const ghostBtn =
  "inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-xs font-bold text-foreground hover:bg-secondary";

// ─── Reusable Modal (same pattern as ServicesTab) ───────────────────────────
const Modal = ({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-card w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border border-border shadow-xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card rounded-t-3xl sm:rounded-t-2xl z-10">
          <span className="text-sm font-bold text-foreground">{title}</span>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary text-muted-foreground"><X className="size-4" /></button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

const effectChipClass = (t: BuybackEffectType) =>
  t.startsWith("add")
    ? "rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600"
    : "rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-bold text-red-500";

// ─── Option editor modal (Add/Edit option) ───────────────────────────────────
function OptionModal({
  open, onClose, initial, onSave, saving,
}: {
  open: boolean;
  onClose: () => void;
  initial?: Partial<BuybackOption> | null;
  onSave: (data: { label: string; description: string; effect_type: BuybackEffectType; amount: number }) => void;
  saving: boolean;
}) {
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [effectType, setEffectType] = useState<BuybackEffectType>("deduct_fixed");
  const [amount, setAmount] = useState("0");

  useEffect(() => {
    if (open) {
      setLabel(initial?.label ?? "");
      setDescription(initial?.description ?? "");
      setEffectType((initial?.effect_type as BuybackEffectType) ?? "deduct_fixed");
      setAmount(String(initial?.amount ?? 0));
    }
  }, [open, initial]);

  const isPercent = effectType.endsWith("percent");

  return (
    <Modal open={open} onClose={onClose} title={initial?.id ? "Edit option" : "Add option"}>
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">Option label</label>
          <input className={inputClass} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Weak / dead battery" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">Description (optional)</label>
          <input className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Battery drains fast or not charging" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Effect</label>
            <select className={selectClass} value={effectType} onChange={(e) => setEffectType(e.target.value as BuybackEffectType)}>
              {EFFECT_TYPES.map((t) => (
                <option key={t} value={t}>{EFFECT_LABELS[t].label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">{isPercent ? "Percent (%)" : "Amount (₹)"}</label>
            <input
              className={inputClass}
              type="number"
              min={0}
              max={isPercent ? 100 : undefined}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">{EFFECT_LABELS[effectType].helper}</p>
        <div className="flex justify-end gap-2 pt-2">
          <button className={ghostBtn} onClick={onClose}>Cancel</button>
          <button
            className={primaryBtn}
            disabled={saving || !label.trim()}
            onClick={() => onSave({ label: label.trim(), description: description.trim(), effect_type: effectType, amount: Number(amount) || 0 })}
          >
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
            {initial?.id ? "Save" : "Add"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Question editor modal (Add/Edit question) ───────────────────────────────
function QuestionModal({
  open, onClose, initial, onSave, saving,
}: {
  open: boolean;
  onClose: () => void;
  initial?: Partial<BuybackQuestionRow> | null;
  onSave: (data: { title: string; description: string; question_type: "single" | "multi" }) => void;
  saving: boolean;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questionType, setQuestionType] = useState<"single" | "multi">("single");

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? "");
      setDescription(initial?.description ?? "");
      setQuestionType((initial?.question_type as "single" | "multi") ?? "single");
    }
  }, [open, initial]);

  return (
    <Modal open={open} onClose={onClose} title={initial?.id ? "Edit question" : "Add question"}>
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">Question</label>
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Is your device turning on?" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">Description (optional)</label>
          <input className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Shown as helper text to the customer" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">Answer type</label>
          <select className={selectClass} value={questionType} onChange={(e) => setQuestionType(e.target.value as "single" | "multi")}>
            <option value="single">Single — customer picks exactly one option</option>
            <option value="multi">Multi-select — customer can pick several</option>
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button className={ghostBtn} onClick={onClose}>Cancel</button>
          <button
            className={primaryBtn}
            disabled={saving || !title.trim()}
            onClick={() => onSave({ title: title.trim(), description: description.trim(), question_type: questionType })}
          >
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
            {initial?.id ? "Save" : "Add"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Buyback model prices section ─────────────────────────────────────────────
function BuybackPricesSection({ serviceType, canDelete }: { serviceType: ServiceType; canDelete: boolean }) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [modelsList, setModelsList] = useState<Model[]>([]);
  const [prices, setPrices] = useState<Record<string, ModelPrice>>({});
  const [brandId, setBrandId] = useState("");
  const [seriesId, setSeriesId] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await dataClient.from("brands").select("id, name, sort_order, service_type").eq("service_type", serviceType).order("sort_order").order("name");
      setBrands(data || []);
    })();
  }, [serviceType]);

  useEffect(() => {
    setSeriesList([]); setSeriesId(""); setModelsList([]); setPrices({});
    if (!brandId) return;
    (async () => {
      const { data } = await dataClient.from("series").select("id, brand_id, name").eq("brand_id", brandId).order("name");
      setSeriesList(data || []);
    })();
  }, [brandId]);

  const loadModels = useCallback(async (sid: string) => {
    setLoading(true);
    const { data: models } = await dataClient.from("models").select("id, series_id, name").eq("series_id", sid).order("name");
    const list: Model[] = models || [];
    setModelsList(list);
    if (list.length > 0) {
      const { data: priceRows } = await dataClient.from("buyback_model_prices").select("*").in("model_id", list.map((m) => m.id));
      const map: Record<string, ModelPrice> = {};
      for (const p of priceRows || []) map[p.model_id] = { ...p, base_price: Number(p.base_price) };
      setPrices(map);
      const d: Record<string, string> = {};
      for (const m of list) d[m.id] = map[m.id] ? String(map[m.id].base_price) : "";
      setDrafts(d);
    } else {
      setPrices({}); setDrafts({});
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    setModelsList([]); setPrices({});
    if (seriesId) loadModels(seriesId);
  }, [seriesId, loadModels]);

  const savePrice = async (modelId: string) => {
    const value = Number(drafts[modelId]);
    if (!Number.isFinite(value) || value < 0) { toast.error("Enter a valid price"); return; }
    setSavingId(modelId);
    const existing = prices[modelId];
    const { data, error } = await dataClient
      .from("buyback_model_prices")
      .upsert({ model_id: modelId, base_price: value, active: existing?.active ?? true }, { onConflict: "model_id" })
      .select()
      .single();
    setSavingId(null);
    if (error) { toast.error(error.message || "Failed to save price"); return; }
    setPrices((p) => ({ ...p, [modelId]: { ...data, base_price: Number(data.base_price) } }));
    toast.success("Buyback price saved");
  };

  const toggleActive = async (modelId: string) => {
    const existing = prices[modelId];
    if (!existing) { toast.error("Set a price first"); return; }
    const next = !existing.active;
    const { error } = await dataClient.from("buyback_model_prices").update({ active: next }).eq("id", existing.id);
    if (error) { toast.error(error.message || "Failed to update"); return; }
    setPrices((p) => ({ ...p, [modelId]: { ...existing, active: next } }));
  };

  const clearPrice = async (modelId: string) => {
    const existing = prices[modelId];
    if (!existing) return;
    const { error } = await dataClient.from("buyback_model_prices").delete().eq("id", existing.id);
    if (error) { toast.error(error.message || "Failed to remove"); return; }
    setPrices((p) => { const n = { ...p }; delete n[modelId]; return n; });
    setDrafts((d) => ({ ...d, [modelId]: "" }));
    toast.success("Buyback price removed");
  };

  const visibleModels = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? modelsList.filter((m) => m.name.toLowerCase().includes(q)) : modelsList;
  }, [modelsList, search]);

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Set the buyback price a customer gets for a device in <b>perfect, fully-working condition</b>. Evaluation questions below adjust this base price.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <select className={selectClass} value={brandId} onChange={(e) => setBrandId(e.target.value)}>
          <option value="">Choose {serviceType} brand...</option>
          {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select className={selectClass} value={seriesId} onChange={(e) => setSeriesId(e.target.value)} disabled={!brandId}>
          <option value="">Choose series...</option>
          {seriesList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {seriesId && modelsList.length > 4 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input className={inputClass + " pl-9"} placeholder="Search models..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-10 text-muted-foreground"><Loader2 className="size-5 animate-spin" /></div>
      ) : seriesId && visibleModels.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No models in this series.</p>
      ) : (
        <div className="space-y-2">
          {visibleModels.map((m) => {
            const price = prices[m.id];
            const dirty = drafts[m.id] !== (price ? String(price.base_price) : "");
            return (
              <div key={m.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-foreground">{m.name}</div>
                  {price && (
                    <div className="text-[11px] text-muted-foreground">
                      {price.active ? "Live for buyback" : "Hidden from buyback"}
                    </div>
                  )}
                </div>
                <div className="relative w-32">
                  <IndianRupee className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    className={inputClass + " pl-7"}
                    type="number"
                    min={0}
                    placeholder="Price"
                    value={drafts[m.id] ?? ""}
                    onChange={(e) => setDrafts((d) => ({ ...d, [m.id]: e.target.value }))}
                  />
                </div>
                <button className={primaryBtn} disabled={savingId === m.id || !dirty || drafts[m.id] === ""} onClick={() => savePrice(m.id)}>
                  {savingId === m.id ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                  Save
                </button>
                {price && (
                  <button
                    className={"rounded-full px-3 py-1.5 text-[11px] font-bold " + (price.active ? "bg-emerald-500/10 text-emerald-600" : "bg-secondary text-muted-foreground")}
                    onClick={() => toggleActive(m.id)}
                    title="Toggle whether this model is offered for buyback"
                  >
                    {price.active ? "Active" : "Inactive"}
                  </button>
                )}
                {price && canDelete && (
                  <button className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10" onClick={() => clearPrice(m.id)} title="Remove buyback price">
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Evaluation questions builder ────────────────────────────────────────────
function BuybackQuestionsSection({
  serviceType, canDelete, questions, optionsByQuestion, reload,
}: {
  serviceType: ServiceType;
  canDelete: boolean;
  questions: BuybackQuestionRow[];
  optionsByQuestion: Record<string, BuybackOption[]>;
  reload: () => Promise<void>;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [questionModal, setQuestionModal] = useState<{ open: boolean; initial: Partial<BuybackQuestionRow> | null }>({ open: false, initial: null });
  const [optionModal, setOptionModal] = useState<{ open: boolean; questionId: string; initial: Partial<BuybackOption> | null }>({ open: false, questionId: "", initial: null });

  const saveQuestion = async (data: { title: string; description: string; question_type: "single" | "multi" }) => {
    setSaving(true);
    const initial = questionModal.initial;
    let error;
    if (initial?.id) {
      ({ error } = await dataClient.from("buyback_questions").update(data).eq("id", initial.id));
    } else {
      const sortOrder = questions.length > 0 ? Math.max(...questions.map((q) => q.sort_order)) + 1 : 1;
      ({ error } = await dataClient.from("buyback_questions").insert({ ...data, service_type: serviceType, sort_order: sortOrder, active: true }));
    }
    setSaving(false);
    if (error) { toast.error(error.message || "Failed to save question"); return; }
    setQuestionModal({ open: false, initial: null });
    toast.success(initial?.id ? "Question updated" : "Question added");
    await reload();
  };

  const deleteQuestion = async (id: string) => {
    if (!window.confirm("Delete this question and all its options?")) return;
    const { error } = await dataClient.from("buyback_questions").delete().eq("id", id);
    if (error) { toast.error(error.message || "Failed to delete"); return; }
    toast.success("Question deleted");
    await reload();
  };

  const saveOption = async (data: { label: string; description: string; effect_type: BuybackEffectType; amount: number }) => {
    setSaving(true);
    const { questionId, initial } = optionModal;
    let error;
    if (initial?.id) {
      ({ error } = await dataClient.from("buyback_question_options").update(data).eq("id", initial.id));
    } else {
      const opts = optionsByQuestion[questionId] || [];
      const sortOrder = opts.length > 0 ? Math.max(...opts.map((o) => o.sort_order)) + 1 : 1;
      ({ error } = await dataClient.from("buyback_question_options").insert({ ...data, question_id: questionId, sort_order: sortOrder }));
    }
    setSaving(false);
    if (error) { toast.error(error.message || "Failed to save option"); return; }
    setOptionModal({ open: false, questionId: "", initial: null });
    toast.success(initial?.id ? "Option updated" : "Option added");
    await reload();
  };

  const deleteOption = async (id: string) => {
    if (!window.confirm("Delete this option?")) return;
    const { error } = await dataClient.from("buyback_question_options").delete().eq("id", id);
    if (error) { toast.error(error.message || "Failed to delete"); return; }
    toast.success("Option deleted");
    await reload();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">Evaluation questions buyers answer — each option adjusts the quote.</p>
        <button className={primaryBtn} onClick={() => setQuestionModal({ open: true, initial: null })}>
          <Plus className="size-3.5" /> Add question
        </button>
      </div>

      {questions.length === 0 && (
        <p className="rounded-2xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
          No evaluation questions yet. Add one to start building the {serviceType} buyback flow.
        </p>
      )}

      {questions.map((q, idx) => {
        const opts = optionsByQuestion[q.id] || [];
        const isOpen = expanded[q.id] ?? idx === 0;
        return (
          <div key={q.id} className="rounded-2xl border border-border bg-card p-3 sm:p-4">
            <div className="flex items-center gap-2.5">
              <span className="flex size-6 flex-shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-foreground">{idx + 1}</span>
              <span className="min-w-0 flex-1 truncate text-sm font-bold text-foreground">{q.title}</span>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                {q.question_type === "multi" ? "Multi-select" : "Single"}
              </span>
              <button className="p-1 rounded-lg text-muted-foreground hover:bg-secondary" onClick={() => setExpanded((e) => ({ ...e, [q.id]: !isOpen }))}>
                {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </button>
              <button className="p-1 rounded-lg text-muted-foreground hover:bg-secondary" onClick={() => setQuestionModal({ open: true, initial: q })}>
                <Pencil className="size-4" />
              </button>
              {canDelete && (
                <button className="p-1 rounded-lg text-red-500 hover:bg-red-500/10" onClick={() => deleteQuestion(q.id)}>
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
            {q.description && <p className="mt-1 pl-9 text-[11px] text-muted-foreground">{q.description}</p>}

            {isOpen && (
              <div className="mt-3 space-y-2">
                {opts.map((o) => (
                  <div key={o.id} className="flex items-center gap-3 rounded-xl border border-border/70 bg-background p-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-foreground">{o.label}</div>
                      {o.description && <div className="truncate text-[11px] text-muted-foreground">{o.description}</div>}
                    </div>
                    <span className={effectChipClass(o.effect_type)}>{formatEffect(o.effect_type, o.amount)}</span>
                    <button className="p-1 rounded-lg text-muted-foreground hover:bg-secondary" onClick={() => setOptionModal({ open: true, questionId: q.id, initial: o })}>
                      <Pencil className="size-4" />
                    </button>
                    {canDelete && (
                      <button className="p-1 rounded-lg text-red-500 hover:bg-red-500/10" onClick={() => deleteOption(o.id)}>
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-2.5 text-xs font-semibold text-muted-foreground hover:bg-secondary"
                  onClick={() => setOptionModal({ open: true, questionId: q.id, initial: null })}
                >
                  <Plus className="size-3.5" /> Add option
                </button>
              </div>
            )}
          </div>
        );
      })}

      <QuestionModal
        open={questionModal.open}
        onClose={() => setQuestionModal({ open: false, initial: null })}
        initial={questionModal.initial}
        onSave={saveQuestion}
        saving={saving}
      />
      <OptionModal
        open={optionModal.open}
        onClose={() => setOptionModal({ open: false, questionId: "", initial: null })}
        initial={optionModal.initial}
        onSave={saveOption}
        saving={saving}
      />
    </div>
  );
}

// ─── Quote preview / calculator ──────────────────────────────────────────────
function QuotePreviewSection({
  serviceType, questions, optionsByQuestion,
}: {
  serviceType: ServiceType;
  questions: BuybackQuestionRow[];
  optionsByQuestion: Record<string, BuybackOption[]>;
}) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [modelsList, setModelsList] = useState<Model[]>([]);
  const [brandId, setBrandId] = useState("");
  const [seriesId, setSeriesId] = useState("");
  const [modelId, setModelId] = useState("");
  const [price, setPrice] = useState<ModelPrice | null>(null);
  const [selected, setSelected] = useState<Record<string, string[]>>({});

  useEffect(() => {
    (async () => {
      const { data } = await dataClient.from("brands").select("id, name, sort_order, service_type").eq("service_type", serviceType).order("sort_order").order("name");
      setBrands(data || []);
    })();
  }, [serviceType]);

  useEffect(() => {
    setSeriesList([]); setSeriesId("");
    if (!brandId) return;
    (async () => {
      const { data } = await dataClient.from("series").select("id, brand_id, name").eq("brand_id", brandId).order("name");
      setSeriesList(data || []);
    })();
  }, [brandId]);

  useEffect(() => {
    setModelsList([]); setModelId("");
    if (!seriesId) return;
    (async () => {
      const { data } = await dataClient.from("models").select("id, series_id, name").eq("series_id", seriesId).order("name");
      setModelsList(data || []);
    })();
  }, [seriesId]);

  useEffect(() => {
    setPrice(null); setSelected({});
    if (!modelId) return;
    (async () => {
      const { data } = await dataClient.from("buyback_model_prices").select("*").eq("model_id", modelId).maybeSingle();
      setPrice(data ? { ...data, base_price: Number(data.base_price) } : null);
    })();
  }, [modelId]);

  const pick = (q: BuybackQuestionRow, optionId: string) => {
    setSelected((s) => {
      const current = s[q.id] || [];
      if (q.question_type === "single") {
        return { ...s, [q.id]: current[0] === optionId ? [] : [optionId] };
      }
      return { ...s, [q.id]: current.includes(optionId) ? current.filter((x) => x !== optionId) : [...current, optionId] };
    });
  };

  const quote = useMemo(
    () => (price ? computeBuybackQuote(price.base_price, questions, optionsByQuestion, selected) : null),
    [price, questions, optionsByQuestion, selected],
  );

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Test the buyback flow exactly as a customer would see it: pick a model, answer the questions, and watch the quote update.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <select className={selectClass} value={brandId} onChange={(e) => setBrandId(e.target.value)}>
          <option value="">Brand...</option>
          {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select className={selectClass} value={seriesId} onChange={(e) => setSeriesId(e.target.value)} disabled={!brandId}>
          <option value="">Series...</option>
          {seriesList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className={selectClass} value={modelId} onChange={(e) => setModelId(e.target.value)} disabled={!seriesId}>
          <option value="">Model...</option>
          {modelsList.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>

      {modelId && !price && (
        <p className="rounded-2xl border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
          No buyback price set for this model yet — add one in the Prices section first.
        </p>
      )}

      {price && (
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="space-y-3">
            {questions.map((q, idx) => (
              <div key={q.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex size-5 items-center justify-center rounded-full bg-secondary text-[10px] font-bold">{idx + 1}</span>
                  <span className="text-sm font-bold text-foreground">{q.title}</span>
                  {q.question_type === "multi" && <span className="text-[10px] text-muted-foreground">(select all that apply)</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {(optionsByQuestion[q.id] || []).map((o) => {
                    const active = (selected[q.id] || []).includes(o.id);
                    return (
                      <button
                        key={o.id}
                        onClick={() => pick(q, o.id)}
                        className={
                          "rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-colors " +
                          (active ? "border-primary bg-primary/10 text-foreground" : "border-border bg-background text-muted-foreground hover:bg-secondary")
                        }
                      >
                        <span>{o.label}</span>
                        <span className={"ml-2 " + (o.effect_type.startsWith("add") ? "text-emerald-600" : "text-red-500")}>
                          {formatEffect(o.effect_type, o.amount)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="h-fit rounded-2xl border border-border bg-card p-4 lg:sticky lg:top-20">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
              <Calculator className="size-4 text-primary" /> Quote breakdown
            </div>
            <div className="flex items-center justify-between border-b border-border pb-2 text-sm">
              <span className="text-muted-foreground">Base price</span>
              <span className="font-bold text-foreground">₹{quote!.basePrice.toLocaleString("en-IN")}</span>
            </div>
            <div className="max-h-64 space-y-1.5 overflow-y-auto py-2">
              {quote!.lines.length === 0 && <p className="text-[11px] text-muted-foreground">Answer the questions to see adjustments.</p>}
              {quote!.lines.map((l) => (
                <div key={l.optionId} className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate text-muted-foreground">{l.optionLabel}</span>
                  <span className={"font-semibold " + (l.impact >= 0 ? "text-emerald-600" : "text-red-500")}>
                    {l.impact >= 0 ? "+" : "−"}₹{Math.abs(l.impact).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-sm font-bold text-foreground">Final quote</span>
              <span className="text-xl font-extrabold text-primary">₹{quote!.finalQuote.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Per-service-type wrapper (loads questions once, shares with sections) ───
function BuybackServicePanel({ serviceType, canDelete }: { serviceType: ServiceType; canDelete: boolean }) {
  const [questions, setQuestions] = useState<BuybackQuestionRow[]>([]);
  const [optionsByQuestion, setOptionsByQuestion] = useState<Record<string, BuybackOption[]>>({});
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(async () => {
    const { data: qs } = await dataClient
      .from("buyback_questions").select("*").eq("service_type", serviceType).order("sort_order").order("created_at");
    const list: BuybackQuestionRow[] = qs || [];
    setQuestions(list);
    if (list.length > 0) {
      const { data: opts } = await dataClient
        .from("buyback_question_options").select("*").in("question_id", list.map((q) => q.id)).order("sort_order");
      const map: Record<string, BuybackOption[]> = {};
      for (const o of opts || []) {
        (map[o.question_id] ||= []).push({ ...o, amount: Number(o.amount) });
      }
      setOptionsByQuestion(map);
    } else {
      setOptionsByQuestion({});
    }
    setLoaded(true);
  }, [serviceType]);

  useEffect(() => { reload(); }, [reload]);

  const [section, setSection] = useState("prices");

  return (
    <Tabs value={section} onValueChange={setSection} className="w-full">
      <TabsList className="flex !h-auto w-full !justify-start gap-1 overflow-x-auto rounded-2xl p-1 md:grid md:max-w-md md:grid-cols-3 md:overflow-visible">
        <TabsTrigger value="prices" className="min-w-[92px] flex-shrink-0 gap-1 px-3 py-2.5 text-[10px] md:min-w-0">
          <IndianRupee className="size-3.5" /> Prices
        </TabsTrigger>
        <TabsTrigger value="questions" className="min-w-[92px] flex-shrink-0 gap-1 px-3 py-2.5 text-[10px] md:min-w-0">
          <ListChecks className="size-3.5" /> Questions
        </TabsTrigger>
        <TabsTrigger value="preview" className="min-w-[92px] flex-shrink-0 gap-1 px-3 py-2.5 text-[10px] md:min-w-0">
          <Calculator className="size-3.5" /> Quote preview
        </TabsTrigger>
      </TabsList>

      <TabsContent value="prices" className="pt-4">
        <BuybackPricesSection serviceType={serviceType} canDelete={canDelete} />
      </TabsContent>
      <TabsContent value="questions" className="pt-4">
        {loaded ? (
          <BuybackQuestionsSection
            serviceType={serviceType}
            canDelete={canDelete}
            questions={questions}
            optionsByQuestion={optionsByQuestion}
            reload={reload}
          />
        ) : (
          <div className="flex items-center justify-center py-10 text-muted-foreground"><Loader2 className="size-5 animate-spin" /></div>
        )}
      </TabsContent>
      <TabsContent value="preview" className="pt-4">
        <QuotePreviewSection serviceType={serviceType} questions={questions} optionsByQuestion={optionsByQuestion} />
      </TabsContent>
    </Tabs>
  );
}

// ─── Top-level Buyback tab ────────────────────────────────────────────────────
export default function BuybackTab({ canDelete = true }: { canDelete?: boolean }) {
  const [device, setDevice] = useState<ServiceType>("mobile");

  return (
    <div className="space-y-4 pt-4">
      <Tabs value={device} onValueChange={(v) => setDevice(v as ServiceType)} className="w-full">
        <TabsList className="flex !h-auto w-full !justify-start gap-1 rounded-2xl p-1 sm:max-w-xs sm:grid sm:grid-cols-2">
          <TabsTrigger value="mobile" className="flex-shrink-0 gap-1.5 px-4 py-2.5 text-xs">
            <Smartphone className="size-3.5" /> Mobile
          </TabsTrigger>
          <TabsTrigger value="laptop" className="flex-shrink-0 gap-1.5 px-4 py-2.5 text-xs">
            <Laptop className="size-3.5" /> Laptop
          </TabsTrigger>
        </TabsList>
        <TabsContent value="mobile" className="pt-4">
          {device === "mobile" ? <BuybackServicePanel serviceType="mobile" canDelete={canDelete} /> : null}
        </TabsContent>
        <TabsContent value="laptop" className="pt-4">
          {device === "laptop" ? <BuybackServicePanel serviceType="laptop" canDelete={canDelete} /> : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
