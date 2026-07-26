"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/src/lib/data-client/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import {
  Plus, Trash2, Pencil, Loader2, X, Check, Smartphone, Laptop, Tablet, Watch, Headphones, ChevronDown, ChevronUp, IndianRupee, Calculator, ListChecks, Search,
} from "lucide-react";
import {
  BuybackEffectType, BuybackOption, BuybackOsSegment, BuybackQuestionRow, EFFECT_LABELS,
  brandOsSegment, computeBuybackQuote, formatEffect, questionMatchesSegment,
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
type ModelVariant = { id: string; model_id: string; variant_label: string; base_price: number; sort_order: number; active: boolean };
type ServiceType = "mobile" | "laptop" | "tablet" | "smartwatch" | "audio";

// Storage size implied by a variant label (e.g. "64 GB" -> 64, "1 TB" -> 1024,
// bare "64" or "6/128" -> the last number, in GB), so variants always display
// smallest-to-largest regardless of the order they were added in, instead of
// relying on a manually-set sort_order. Labels without a number sort last.
function storageSortValue(label: string): number {
  const tb = label.match(/(\d+(?:\.\d+)?)\s*TB/i);
  if (tb) return parseFloat(tb[1]) * 1024;
  const numbers = label.match(/\d+(?:\.\d+)?/g);
  if (!numbers || numbers.length === 0) return Number.POSITIVE_INFINITY;
  return parseFloat(numbers[numbers.length - 1]);
}

function sortVariants<T extends { variant_label: string }>(list: T[]): T[] {
  return [...list].sort((a, b) => storageSortValue(a.variant_label) - storageSortValue(b.variant_label));
}

const EFFECT_TYPES: BuybackEffectType[] = ["deduct_fixed", "deduct_percent", "add_fixed", "add_percent"];

// Which brands a question applies to. Apple devices and Android/other devices
// can have different evaluation questions (and deduction prices); 'all'
// questions are asked for every brand.
const OS_SEGMENTS: Array<{ value: BuybackOsSegment; label: string }> = [
  { value: "all", label: "All devices" },
  { value: "apple", label: "Apple only" },
  { value: "android", label: "Android / other only" },
];

const segmentChipClass = (segment: string) =>
  segment === "apple"
    ? "rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-600"
    : "rounded-full bg-lime-500/10 px-2 py-0.5 text-[10px] font-semibold text-lime-600";

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
  onSave: (data: { title: string; description: string; question_type: "single" | "multi"; os_segment: BuybackOsSegment }) => void;
  saving: boolean;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questionType, setQuestionType] = useState<"single" | "multi">("single");
  const [osSegment, setOsSegment] = useState<BuybackOsSegment>("all");

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? "");
      setDescription(initial?.description ?? "");
      setQuestionType((initial?.question_type as "single" | "multi") ?? "single");
      setOsSegment((initial?.os_segment as BuybackOsSegment) || "all");
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
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">Applies to</label>
          <select className={selectClass} value={osSegment} onChange={(e) => setOsSegment(e.target.value as BuybackOsSegment)}>
            {OS_SEGMENTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Apple-only questions show for Apple devices; Android/other for every other brand. &quot;All devices&quot; questions show for both.
          </p>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button className={ghostBtn} onClick={onClose}>Cancel</button>
          <button
            className={primaryBtn}
            disabled={saving || !title.trim()}
            onClick={() => onSave({ title: title.trim(), description: description.trim(), question_type: questionType, os_segment: osSegment })}
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
// Per-model storage/spec variants (64 GB / 128 GB ...), each with its own
// buyback base price. When a model has active variants the customer picks one
// and its price becomes the quote base instead of the flat model price.
function VariantsEditor({
  modelId, variants, onChange, canDelete,
}: {
  modelId: string;
  variants: ModelVariant[];
  onChange: (next: ModelVariant[]) => void;
  canDelete: boolean;
}) {
  const [newLabel, setNewLabel] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>(
    () => Object.fromEntries(variants.map((v) => [v.id, String(v.base_price)])),
  );
  const [busyId, setBusyId] = useState<string | null>(null);

  const addVariant = async () => {
    const label = newLabel.trim();
    const price = Number(newPrice);
    if (!label) { toast.error("Enter a variant label, e.g. 128 GB"); return; }
    if (!Number.isFinite(price) || price < 0) { toast.error("Enter a valid price"); return; }
    setBusyId("new");
    const { data, error } = await dataClient
      .from("buyback_model_variants")
      .insert({ model_id: modelId, variant_label: label, base_price: price, sort_order: variants.length + 1, active: true })
      .select()
      .single();
    setBusyId(null);
    if (error) { toast.error(error.message || "Failed to add variant"); return; }
    const added = { ...data, base_price: Number(data.base_price) };
    onChange(sortVariants([...variants, added]));
    setPriceDrafts((d) => ({ ...d, [added.id]: String(added.base_price) }));
    setNewLabel(""); setNewPrice("");
    toast.success("Variant added");
  };

  const saveVariantPrice = async (variant: ModelVariant) => {
    const price = Number(priceDrafts[variant.id]);
    if (!Number.isFinite(price) || price < 0) { toast.error("Enter a valid price"); return; }
    setBusyId(variant.id);
    const { error } = await dataClient.from("buyback_model_variants").update({ base_price: price }).eq("id", variant.id);
    setBusyId(null);
    if (error) { toast.error(error.message || "Failed to save"); return; }
    onChange(variants.map((v) => (v.id === variant.id ? { ...v, base_price: price } : v)));
    toast.success("Variant price saved");
  };

  const toggleVariantActive = async (variant: ModelVariant) => {
    const next = !variant.active;
    const { error } = await dataClient.from("buyback_model_variants").update({ active: next }).eq("id", variant.id);
    if (error) { toast.error(error.message || "Failed to update"); return; }
    onChange(variants.map((v) => (v.id === variant.id ? { ...v, active: next } : v)));
  };

  const removeVariant = async (variant: ModelVariant) => {
    const { error } = await dataClient.from("buyback_model_variants").delete().eq("id", variant.id);
    if (error) { toast.error(error.message || "Failed to remove"); return; }
    onChange(variants.filter((v) => v.id !== variant.id));
    toast.success("Variant removed");
  };

  return (
    <div className="w-full space-y-2 rounded-xl bg-secondary/40 p-3">
      <p className="text-[11px] text-muted-foreground">
        Variants (e.g. 64 GB / 128 GB) each get their own base price. When variants exist, customers pick one and the flat model price above is ignored.
      </p>
      {variants.map((variant) => {
        const dirty = priceDrafts[variant.id] !== String(variant.base_price);
        return (
          <div key={variant.id} className="flex flex-wrap items-center gap-2">
            <span className="min-w-24 rounded-lg bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground">{variant.variant_label}</span>
            <div className="relative w-28">
              <IndianRupee className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                className={inputClass + " pl-7"}
                type="number"
                min={0}
                value={priceDrafts[variant.id] ?? ""}
                onChange={(e) => setPriceDrafts((d) => ({ ...d, [variant.id]: e.target.value }))}
              />
            </div>
            <button className={primaryBtn} disabled={busyId === variant.id || !dirty} onClick={() => saveVariantPrice(variant)}>
              {busyId === variant.id ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
            </button>
            <button
              className={"rounded-full px-2.5 py-1 text-[10px] font-bold " + (variant.active ? "bg-emerald-500/10 text-emerald-600" : "bg-secondary text-muted-foreground")}
              onClick={() => toggleVariantActive(variant)}
            >
              {variant.active ? "Active" : "Inactive"}
            </button>
            {canDelete && (
              <button className="rounded-lg p-1.5 text-red-500 hover:bg-red-500/10" onClick={() => removeVariant(variant)} title="Remove variant">
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>
        );
      })}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <input
          className={inputClass + " w-32"}
          placeholder="e.g. 128 GB"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
        />
        <div className="relative w-28">
          <IndianRupee className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input className={inputClass + " pl-7"} type="number" min={0} placeholder="Price" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} />
        </div>
        <button className={primaryBtn} disabled={busyId === "new"} onClick={addVariant}>
          {busyId === "new" ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
          Add variant
        </button>
      </div>
    </div>
  );
}

function BuybackPricesSection({ serviceType, canDelete }: { serviceType: ServiceType; canDelete: boolean }) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [modelsList, setModelsList] = useState<Model[]>([]);
  const [prices, setPrices] = useState<Record<string, ModelPrice>>({});
  const [variants, setVariants] = useState<Record<string, ModelVariant[]>>({});
  const [expandedModelId, setExpandedModelId] = useState<string | null>(null);
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
      const ids = list.map((m) => m.id);
      const [{ data: priceRows }, { data: variantRows }] = await Promise.all([
        dataClient.from("buyback_model_prices").select("*").in("model_id", ids),
        dataClient.from("buyback_model_variants").select("*").in("model_id", ids).order("sort_order").order("created_at"),
      ]);
      const map: Record<string, ModelPrice> = {};
      for (const p of priceRows || []) map[p.model_id] = { ...p, base_price: Number(p.base_price) };
      setPrices(map);
      const vmap: Record<string, ModelVariant[]> = {};
      for (const v of variantRows || []) {
        (vmap[v.model_id] ??= []).push({ ...v, base_price: Number(v.base_price) });
      }
      for (const modelId of Object.keys(vmap)) vmap[modelId] = sortVariants(vmap[modelId]);
      setVariants(vmap);
      const d: Record<string, string> = {};
      for (const m of list) d[m.id] = map[m.id] ? String(map[m.id].base_price) : "";
      setDrafts(d);
    } else {
      setPrices({}); setDrafts({}); setVariants({});
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
            const modelVariants = variants[m.id] ?? [];
            const isExpanded = expandedModelId === m.id;
            return (
              <div key={m.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-foreground">{m.name}</div>
                  {price && (
                    <div className="text-[11px] text-muted-foreground">
                      {price.active ? "Live for buyback" : "Hidden from buyback"}
                      {modelVariants.length > 0 ? ` · ${modelVariants.length} variant${modelVariants.length === 1 ? "" : "s"}` : ""}
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
                <button
                  className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-[11px] font-bold text-foreground"
                  onClick={() => setExpandedModelId(isExpanded ? null : m.id)}
                  title="Per-variant prices (e.g. 64 GB / 128 GB)"
                >
                  Variants{modelVariants.length > 0 ? ` (${modelVariants.length})` : ""}
                  {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                </button>
                {isExpanded && (
                  <VariantsEditor
                    modelId={m.id}
                    variants={modelVariants}
                    canDelete={canDelete}
                    onChange={(next) => setVariants((v) => ({ ...v, [m.id]: next }))}
                  />
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
  // Which flow is being curated: everything, or exactly what Apple / Android
  // customers see ('all' questions + that segment's own questions).
  const [segmentView, setSegmentView] = useState<"everything" | "apple" | "android">("everything");
  const [questionModal, setQuestionModal] = useState<{ open: boolean; initial: Partial<BuybackQuestionRow> | null }>({ open: false, initial: null });
  const [optionModal, setOptionModal] = useState<{ open: boolean; questionId: string; initial: Partial<BuybackOption> | null }>({ open: false, questionId: "", initial: null });

  const visibleQuestions = useMemo(
    () => (segmentView === "everything" ? questions : questions.filter((q) => questionMatchesSegment(q, segmentView))),
    [questions, segmentView],
  );

  const saveQuestion = async (data: { title: string; description: string; question_type: "single" | "multi"; os_segment: BuybackOsSegment }) => {
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
    if (error) {
      const message = String(error.message || "");
      if (message.includes("os_segment")) {
        toast.error("os_segment column missing — run scripts/migrate-buyback-question-segments.cjs");
      } else {
        toast.error(message || "Failed to save question");
      }
      return;
    }
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

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[11px] font-bold text-muted-foreground">View:</span>
        {([
          ["everything", "All questions"],
          ["apple", "Apple flow"],
          ["android", "Android / other flow"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setSegmentView(value)}
            className={
              "rounded-full border px-3 py-1.5 text-[11px] font-bold transition-colors " +
              (segmentView === value ? "border-primary bg-primary/10 text-foreground" : "border-border bg-card text-muted-foreground hover:bg-secondary")
            }
          >
            {label}
          </button>
        ))}
      </div>
      {segmentView !== "everything" && (
        <p className="text-[11px] text-muted-foreground">
          Showing exactly what a customer selling {segmentView === "apple" ? "an Apple device" : "an Android / other-brand device"} is asked
          (&quot;All devices&quot; questions plus {segmentView === "apple" ? "Apple" : "Android"}-only ones).
        </p>
      )}

      {visibleQuestions.length === 0 && (
        <p className="rounded-2xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
          {questions.length === 0
            ? `No evaluation questions yet. Add one to start building the ${serviceType} buyback flow.`
            : "No questions in this view yet — add one and set who it applies to."}
        </p>
      )}

      {visibleQuestions.map((q, idx) => {
        const opts = optionsByQuestion[q.id] || [];
        const isOpen = expanded[q.id] ?? idx === 0;
        return (
          <div key={q.id} className="rounded-2xl border border-border bg-card p-3 sm:p-4">
            <div className="flex items-center gap-2.5">
              <span className="flex size-6 flex-shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-foreground">{idx + 1}</span>
              <span className="min-w-0 flex-1 truncate text-sm font-bold text-foreground">{q.title}</span>
              {(q.os_segment === "apple" || q.os_segment === "android") && (
                <span className={segmentChipClass(q.os_segment)}>
                  {q.os_segment === "apple" ? "Apple only" : "Android / other"}
                </span>
              )}
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
  const [previewVariants, setPreviewVariants] = useState<ModelVariant[]>([]);
  const [previewVariantId, setPreviewVariantId] = useState("");
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
    setPrice(null); setPreviewVariants([]); setPreviewVariantId(""); setSelected({});
    if (!modelId) return;
    (async () => {
      const [{ data }, { data: variantRows }] = await Promise.all([
        dataClient.from("buyback_model_prices").select("*").eq("model_id", modelId).maybeSingle(),
        dataClient.from("buyback_model_variants").select("*").eq("model_id", modelId).eq("active", true).order("sort_order").order("created_at"),
      ]);
      setPrice(data ? { ...data, base_price: Number(data.base_price) } : null);
      const mapped: ModelVariant[] = sortVariants((variantRows || []).map((v: any) => ({ ...v, base_price: Number(v.base_price) })));
      setPreviewVariants(mapped);
      if (mapped.length > 0) setPreviewVariantId(mapped[0].id);
    })();
  }, [modelId]);

  // Variants win over the flat model price, matching the customer flow.
  const previewVariant = previewVariants.find((v) => v.id === previewVariantId) ?? null;
  const effectiveBasePrice = previewVariants.length > 0
    ? (previewVariant ? previewVariant.base_price : null)
    : (price && price.active ? price.base_price : null);

  // Only the questions this brand's customers actually see, matching the sell
  // flow: Apple brands get 'all' + Apple-only, everything else 'all' + Android.
  const previewBrand = brands.find((b) => b.id === brandId) ?? null;
  const previewSegment = previewBrand ? brandOsSegment(previewBrand.name) : null;
  const segmentQuestions = useMemo(
    () => (previewSegment ? questions.filter((q) => questionMatchesSegment(q, previewSegment)) : questions),
    [questions, previewSegment],
  );

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
    () => (effectiveBasePrice !== null ? computeBuybackQuote(effectiveBasePrice, segmentQuestions, optionsByQuestion, selected) : null),
    [effectiveBasePrice, segmentQuestions, optionsByQuestion, selected],
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

      {previewVariants.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-foreground">Variant:</span>
          {previewVariants.map((v) => (
            <button
              key={v.id}
              onClick={() => { setPreviewVariantId(v.id); setSelected({}); }}
              className={
                "rounded-xl border px-3 py-2 text-xs font-semibold transition-colors " +
                (previewVariantId === v.id ? "border-primary bg-primary/10 text-foreground" : "border-border bg-background text-muted-foreground hover:bg-secondary")
              }
            >
              {v.variant_label} — ₹{v.base_price.toLocaleString("en-IN")}
            </button>
          ))}
        </div>
      )}

      {modelId && effectiveBasePrice === null && (
        <p className="rounded-2xl border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
          No buyback price set for this model yet — add a price or variants in the Prices section first.
        </p>
      )}

      {effectiveBasePrice !== null && previewSegment && (
        <p className="text-[11px] text-muted-foreground">
          Previewing the <b>{previewSegment === "apple" ? "Apple" : "Android / other"}</b> question flow for {previewBrand?.name}.
        </p>
      )}

      {effectiveBasePrice !== null && (
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="space-y-3">
            {segmentQuestions.map((q, idx) => (
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

// ─── Buyback pickup orders ────────────────────────────────────────────────────
type BuybackBookingRow = {
  id: string;
  booking_code: string;
  service_type: string;
  brand_name: string;
  model_name: string;
  variant_label: string | null;
  quoted_amount: number | null;
  quote_breakdown: string | null;
  customer_name: string;
  phone: string;
  address: string | null;
  pickup_date: string | null;
  time_slot: string | null;
  status: string;
  created_at: string;
};

const BOOKING_STATUSES = ["pending", "quote_requested", "confirmed", "picked_up", "paid", "cancelled"] as const;

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600",
  quote_requested: "bg-sky-500/10 text-sky-600",
  confirmed: "bg-blue-500/10 text-blue-600",
  picked_up: "bg-violet-500/10 text-violet-600",
  paid: "bg-emerald-500/10 text-emerald-600",
  cancelled: "bg-red-500/10 text-red-500",
};

function BuybackOrdersSection({ canDelete }: { canDelete: boolean }) {
  const [rows, setRows] = useState<BuybackBookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await dataClient
      .from("buyback_bookings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    setLoading(false);
    if (error) {
      const message = String(error.message || "");
      if (message.includes("buyback_bookings")) {
        toast.error("buyback_bookings table missing — run scripts/migrate-buyback-bookings.cjs");
      } else {
        toast.error(message || "Failed to load buyback orders");
      }
      return;
    }
    setRows((data || []).map((r: any) => ({ ...r, quoted_amount: r.quoted_amount === null ? null : Number(r.quoted_amount) })));
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (row: BuybackBookingRow, status: string) => {
    setSavingId(row.id);
    const { error } = await dataClient.from("buyback_bookings").update({ status }).eq("id", row.id);
    setSavingId(null);
    if (error) { toast.error(error.message || "Failed to update status"); return; }
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status } : r)));
    toast.success(`Marked ${row.booking_code} as ${status.replace("_", " ")}`);
    // Marking a buyback order paid emails the customer a payment receipt PDF.
    // Best-effort and deduped server-side (guest bookings have no email).
    if (status === "paid") {
      void emailBuybackReceipt(row.id);
    }
  };

  const emailBuybackReceipt = async (bookingId: string) => {
    try {
      const response = await fetch("/api/buyback/send-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const data = await response.json().catch(() => null);
      if (response.ok && data?.ok && data.emailed) {
        toast.success(`Payment receipt emailed to ${data.to}.`);
      }
    } catch {
      // Non-fatal: the status change already succeeded.
    }
  };

  const deleteOrder = async (row: BuybackBookingRow) => {
    if (!window.confirm(`Delete order ${row.booking_code}? This cannot be undone.`)) return;
    setSavingId(row.id);
    const { error } = await dataClient.from("buyback_bookings").delete().eq("id", row.id);
    setSavingId(null);
    if (error) { toast.error(error.message || "Failed to delete order"); return; }
    setRows((prev) => prev.filter((r) => r.id !== row.id));
    toast.success(`Deleted ${row.booking_code}`);
  };

  const visible = statusFilter ? rows.filter((r) => r.status === statusFilter) : rows;

  return (
    <div className="space-y-4 pt-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Pickup bookings and quote requests from the customer sell flow, newest first.
        </p>
        <select className={selectClass + " w-44"} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {BOOKING_STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10 text-muted-foreground"><Loader2 className="size-5 animate-spin" /></div>
      ) : visible.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No buyback orders yet.</p>
      ) : (
        <div className="space-y-2">
          {visible.map((row) => {
            const isExpanded = expandedId === row.id;
            return (
              <div key={row.id} className="rounded-2xl border border-border bg-card p-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-foreground">{row.booking_code}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[row.status] || "bg-secondary text-muted-foreground"}`}>
                        {row.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground">
                      {row.brand_name} {row.model_name}{row.variant_label ? ` (${row.variant_label})` : ""} · {row.customer_name} · {row.phone}
                    </div>
                  </div>
                  {row.quoted_amount !== null && (
                    <span className="text-sm font-bold text-foreground">₹{row.quoted_amount.toLocaleString("en-IN")}</span>
                  )}
                  <button
                    className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-[11px] font-bold text-foreground"
                    onClick={() => setExpandedId(isExpanded ? null : row.id)}
                  >
                    Details {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                  </button>
                  {canDelete && (
                    <button
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10"
                      disabled={savingId === row.id}
                      onClick={() => deleteOrder(row)}
                      title="Delete order"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>

                {isExpanded && (
                  <div className="mt-3 space-y-2 rounded-xl bg-secondary/40 p-3 text-xs text-foreground">
                    <div><b>Placed:</b> {new Date(row.created_at).toLocaleString("en-IN")}</div>
                    {row.address ? <div><b>Address:</b> {row.address}</div> : null}
                    {(row.pickup_date || row.time_slot) ? (
                      <div><b>Pickup:</b> {[row.pickup_date, row.time_slot].filter(Boolean).join(" · ")}</div>
                    ) : null}
                    {row.quote_breakdown ? <div className="text-muted-foreground"><b className="text-foreground">Quote breakdown:</b> {row.quote_breakdown}</div> : null}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="mr-1 font-bold">Set status:</span>
                      {BOOKING_STATUSES.filter((s) => s !== row.status && s !== "quote_requested").map((s) => (
                        <button
                          key={s}
                          disabled={savingId === row.id}
                          onClick={() => updateStatus(row, s)}
                          className={`rounded-full border border-border bg-card px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors hover:border-primary/40 ${s === "cancelled" ? "text-red-500" : "text-foreground"}`}
                        >
                          {s.replace("_", " ")}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Top-level Buyback tab ────────────────────────────────────────────────────
export default function BuybackTab({ canDelete = true }: { canDelete?: boolean }) {
  const [device, setDevice] = useState<ServiceType | "orders">("mobile");

  return (
    <div className="space-y-4 pt-4">
      <Tabs value={device} onValueChange={(v) => setDevice(v as ServiceType | "orders")} className="w-full">
        <TabsList className="flex !h-auto w-full !justify-start gap-1 overflow-x-auto rounded-2xl p-1 sm:max-w-3xl sm:grid sm:grid-cols-6">
          <TabsTrigger value="orders" className="flex-shrink-0 gap-1.5 px-4 py-2.5 text-xs">
            <ListChecks className="size-3.5" /> Orders
          </TabsTrigger>
          <TabsTrigger value="mobile" className="flex-shrink-0 gap-1.5 px-4 py-2.5 text-xs">
            <Smartphone className="size-3.5" /> Mobile
          </TabsTrigger>
          <TabsTrigger value="laptop" className="flex-shrink-0 gap-1.5 px-4 py-2.5 text-xs">
            <Laptop className="size-3.5" /> Laptop
          </TabsTrigger>
          <TabsTrigger value="tablet" className="flex-shrink-0 gap-1.5 px-4 py-2.5 text-xs">
            <Tablet className="size-3.5" /> Tablet
          </TabsTrigger>
          <TabsTrigger value="smartwatch" className="flex-shrink-0 gap-1.5 px-4 py-2.5 text-xs">
            <Watch className="size-3.5" /> Watch
          </TabsTrigger>
          <TabsTrigger value="audio" className="flex-shrink-0 gap-1.5 px-4 py-2.5 text-xs">
            <Headphones className="size-3.5" /> Audio
          </TabsTrigger>
        </TabsList>
        <TabsContent value="orders" className="pt-4">
          {device === "orders" ? <BuybackOrdersSection canDelete={canDelete} /> : null}
        </TabsContent>
        {(["mobile", "laptop", "tablet", "smartwatch", "audio"] as ServiceType[]).map((serviceType) => (
          <TabsContent key={serviceType} value={serviceType} className="pt-4">
            {device === serviceType ? <BuybackServicePanel serviceType={serviceType} canDelete={canDelete} /> : null}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
