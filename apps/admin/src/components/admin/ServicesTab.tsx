import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/src/lib/data-client/client";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Plus, Trash2, Pencil, Loader2, X, Check, Shield, Tag, Smartphone, Laptop, Layers, ChevronDown, Grid3X3, ListTree, GripVertical, Download, Upload, Search
} from "lucide-react";
import * as XLSX from "xlsx";
import { slugify } from "@/src/lib/slug";
import { convertFileToWebp } from "@/src/lib/images/webp";
import ImageUpload from "./ImageUpload";

const dataClient = new Proxy({} as any, {
  get(_target, property) {
    return (createClient() as any)[property];
  },
});

type Brand = { id: string; name: string; slug?: string | null; letter: string; gradient: string; sort_order: number; image_url: string | null; service_type: string };
type Series = { id: string; brand_id: string; name: string; image_url?: string | null };
type Model = { id: string; series_id: string; name: string; image_url?: string | null };
type Guard = { id: string; model_id: string; guard_type: string; price: number; image_url?: string | null };
type GuardCategory = { id: string; name: string };
type GuardType = { id: string; category_id: string; name: string; image_url: string | null; price: number };
type CatalogServiceType = "mobile" | "laptop";

const serviceCopy: Record<CatalogServiceType, { label: string; device: string; brandPlaceholder: string; seriesPlaceholder: string; modelPlaceholder: string }> = {
  mobile: {
    label: "Mobile Repair",
    device: "phone",
    brandPlaceholder: "Choose phone brand...",
    seriesPlaceholder: "Choose phone series...",
    modelPlaceholder: "Choose phone model...",
  },
  laptop: {
    label: "Laptop Repair",
    device: "laptop",
    brandPlaceholder: "Choose laptop brand...",
    seriesPlaceholder: "Choose laptop series...",
    modelPlaceholder: "Choose laptop model...",
  },
};

const sortByName = <T extends { name: string }>(items: T[]) => [...items].sort((a, b) => a.name.localeCompare(b.name));
const sortBrandsForAdmin = (items: Brand[]) => [...items].sort((a, b) => (a.sort_order - b.sort_order) || a.name.localeCompare(b.name));
const sortByPositionThenName = <T extends { name: string; sort_order?: number | null }>(items: T[]) =>
  [...items].sort((a, b) => ((a.sort_order ?? 0) - (b.sort_order ?? 0)) || a.name.localeCompare(b.name));
const normalizeSearchValue = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const MODEL_IMAGE_IMPORT_TEMPLATE = [
  { Model: "iPhone 14", "Image URL": "https://example.com/images/iphone-14.webp" },
  { Model: "Samsung Galaxy S23", "Image URL": "https://example.com/images/s23.webp" },
];

const normalizeSheetValue = (value: unknown) => String(value ?? "").trim();
const normalizeGuardKey = (value: string) => value.trim().toLowerCase();
const adminSubtabListClass = "flex !h-auto w-full !justify-start gap-1 overflow-x-auto rounded-2xl p-1 md:grid md:overflow-visible";
const adminSubtabTriggerClass = "min-w-[92px] flex-shrink-0 gap-1 px-3 py-2.5 text-[10px] md:min-w-0";

const downloadModelImageTemplate = () => {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(MODEL_IMAGE_IMPORT_TEMPLATE);
  XLSX.utils.book_append_sheet(workbook, worksheet, "ModelImages");
  XLSX.writeFile(workbook, "model-image-import-template.xlsx");
};

const parseModelImageImportFile = async (file: File) => {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    return [];
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: "",
    raw: false,
  });

  return rows.map((row) => ({
    modelName: normalizeSheetValue(row.Model || row.model || row.MODEL),
    imageUrl: normalizeSheetValue(row["Image URL"] || row.image_url || row.image || row.Image),
  }));
};

// ─── Reusable Modal ─────────────────────────────
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

const uploadServiceImage = async (bucket: string, id: string, file: File) => {
  const optimizedFile = await convertFileToWebp(file);
  const path = `${id}.webp`;
  const { error } = await dataClient.storage.from(bucket).upload(path, optimizedFile, {
    upsert: true,
    contentType: "image/webp",
    cacheControl: "31536000",
  });
  if (error) return null;
  const publicUrl = dataClient.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  return publicUrl;
};

const hasMissingSlugColumnError = (error: { message?: string } | null | undefined, table: "brands" | "series" | "models") =>
  Boolean(error?.message && error.message.includes(`Could not find the 'slug' column of '${table}' in the schema cache`));

const stripSlugField = <T extends Record<string, unknown>>(payload: T) => {
  const { slug: _slug, ...rest } = payload;
  return rest;
};

const insertWithOptionalSlug = async (table: "brands" | "series" | "models", payload: Record<string, unknown>) => {
  const primaryAttempt = await (dataClient.from(table) as any).insert(payload).select().single();
  if (!hasMissingSlugColumnError(primaryAttempt.error, table)) {
    return primaryAttempt;
  }

  return (dataClient.from(table) as any).insert(stripSlugField(payload)).select().single();
};

const updateWithOptionalSlug = async (table: "brands" | "series" | "models", id: string, payload: Record<string, unknown>) => {
  const primaryAttempt = await (dataClient.from(table) as any).update(payload).eq("id", id);
  if (!hasMissingSlugColumnError(primaryAttempt.error, table)) {
    return primaryAttempt;
  }

  return (dataClient.from(table) as any).update(stripSlugField(payload)).eq("id", id);
};

const fetchRepairCategoriesForAdmin = async (serviceType: string) =>
  (dataClient.from("repair_categories") as any)
    .select("*")
    .eq("service_type", serviceType)
    .order("sort_order")
    .order("name");

const fetchRepairSubcategoriesForAdmin = async (categoryId: string) =>
  (dataClient.from("repair_subcategories") as any)
    .select("*")
    .eq("category_id", categoryId)
    .order("sort_order")
    .order("name");

const insertRepairCatalogRow = async (table: "repair_categories" | "repair_subcategories", payload: Record<string, unknown>) =>
  (dataClient.from(table) as any).insert(payload).select().single();

const getBrandByIdWithOptionalSlug = async (brandId: string) => {
  const withSlug = await (dataClient.from("brands") as any)
    .select("id, name, slug")
    .eq("id", brandId)
    .maybeSingle();

  if (!hasMissingSlugColumnError(withSlug.error, "brands")) {
    return withSlug;
  }

  const withoutSlug = await (dataClient.from("brands") as any)
    .select("id, name")
    .eq("id", brandId)
    .maybeSingle();

  if (!withoutSlug.data) {
    return withoutSlug;
  }

  return {
    ...withoutSlug,
    data: {
      ...withoutSlug.data,
      slug: slugify(withoutSlug.data.name) || withoutSlug.data.id,
    },
  };
};

const getSeriesRevalidationPaths = async (seriesId: string, serviceType: string) => {
  const { data: series } = await (dataClient.from("series") as any)
    .select("id, name, slug, brand_id")
    .eq("id", seriesId)
    .maybeSingle();

  if (!series?.brand_id) {
    return [];
  }

  const { data: brand } = await getBrandByIdWithOptionalSlug(series.brand_id);

  if (!brand) {
    return [];
  }

  const brandSlug = brand.slug || slugify(brand.name) || brand.id;
  const seriesSlug = series.slug || slugify(series.name) || series.id;
  const paths = [serviceType === "laptop" ? `/service/laptop-repair/brands/${brandSlug}/${seriesSlug}` : `/service/mobile-repair/brands/${brandSlug}/${seriesSlug}`];

  if (serviceType !== "laptop") {
    paths.push(`/service/mobile-repair/brands/${brandSlug}/${seriesSlug}`);
  }

  return paths;
};

const getModelRevalidationPaths = async (modelId: string, serviceType: string) => {
  const { data: model } = await (dataClient.from("models") as any)
    .select("id, name, slug, series_id")
    .eq("id", modelId)
    .maybeSingle();

  if (!model?.series_id) {
    return [];
  }

  const { data: series } = await (dataClient.from("series") as any)
    .select("id, name, slug, brand_id")
    .eq("id", model.series_id)
    .maybeSingle();

  if (!series?.brand_id) {
    return [];
  }

  const { data: brand } = await getBrandByIdWithOptionalSlug(series.brand_id);

  if (!brand) {
    return [];
  }

  const brandSlug = brand.slug || slugify(brand.name) || brand.id;
  const seriesSlug = series.slug || slugify(series.name) || series.id;
  const modelSlug = model.slug || slugify(model.name) || model.id;
  const paths = [
    serviceType === "laptop"
      ? `/service/laptop-repair/book/${brandSlug}/${seriesSlug}/${modelSlug}`
      : `/service/mobile-repair/book/${brandSlug}/${seriesSlug}/${modelSlug}`,
  ];

  if (serviceType !== "laptop") {
    paths.push(`/service/mobile-repair/book/${brandSlug}/${seriesSlug}/${modelSlug}`);
  }

  return paths;
};

const revalidateBrandPages = async (serviceType: string) => {
  const paths =
    serviceType === "laptop"
      ? ["/service/laptop-repair", "/service/laptop-repair/brands"]
      : ["/", "/service/mobile-repair", "/service/mobile-repair/brands"];
  const pagePaths =
    serviceType === "laptop"
      ? [
          "/service/[serviceType]",
          "/service/[serviceType]/brands",
          "/service/[serviceType]/brands/[brandSlug]",
          "/service/[serviceType]/brands/[brandSlug]/[seriesSlug]",
          "/service/[serviceType]/book/[brandSlug]/[seriesSlug]/[modelSlug]",
        ]
      : [
          "/",
          "/service/[serviceType]",
          "/service/[serviceType]/brands",
          "/service/[serviceType]/brands/[brandSlug]",
          "/service/[serviceType]/brands/[brandSlug]/[seriesSlug]",
          "/service/[serviceType]/book/[brandSlug]/[seriesSlug]/[modelSlug]",
        ];

  try {
    await fetch("/api/revalidate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paths,
        pagePaths,
        tags: ["catalog", "catalog-brands", "catalog-series", "catalog-models", "homepage-brands"],
      }),
    });
  } catch {
    // Ignore cache refresh errors so admin writes still succeed.
  }
};

const revalidateCatalogMutation = async (serviceType: string, options?: { exactPaths?: string[]; extraTags?: string[] }) => {
  const exactPaths = options?.exactPaths?.filter(Boolean) ?? [];
  const extraTags = options?.extraTags?.filter(Boolean) ?? [];

  try {
    await fetch("/api/revalidate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paths: Array.from(new Set([...exactPaths])),
        pagePaths:
          serviceType === "laptop"
            ? [
                "/service/[serviceType]",
                "/service/[serviceType]/brands",
                "/service/[serviceType]/brands/[brandSlug]",
                "/service/[serviceType]/brands/[brandSlug]/[seriesSlug]",
                "/service/[serviceType]/book/[brandSlug]/[seriesSlug]/[modelSlug]",
              ]
            : [
                "/",
                "/service/[serviceType]",
                "/service/[serviceType]/brands",
                "/service/[serviceType]/brands/[brandSlug]",
                "/service/[serviceType]/brands/[brandSlug]/[seriesSlug]",
                "/service/[serviceType]/book/[brandSlug]/[seriesSlug]/[modelSlug]",
              ],
        tags: [
          "catalog",
          "catalog-brands",
          "catalog-series",
          "catalog-models",
          "catalog-screen-guards",
          "homepage-brands",
          ...extraTags,
        ],
      }),
    });
  } catch {
    // Ignore cache refresh errors so admin writes still succeed.
  }
};

// ─── Brands Tab ─────────────────────────────
const BrandsTab = ({ serviceType = "mobile" }: { serviceType?: CatalogServiceType }) => {
  const copy = serviceCopy[serviceType];
  const [brands, setBrands] = useState<Brand[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editBrand, setEditBrand] = useState<Brand | null>(null);
  const [editName, setEditName] = useState("");
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editImageUrl, setEditImageUrl] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [moveBrand, setMoveBrand] = useState<Brand | null>(null);
  const [movePosition, setMovePosition] = useState("");
  const [moveSaving, setMoveSaving] = useState(false);

  const fetch = async () => {
    const { data } = await dataClient.from("brands").select("*").eq("service_type", serviceType).order("sort_order").order("name");
    if (data) setBrands(data as Brand[]);
  };
  useEffect(() => { fetch(); }, [serviceType]);

  const handleAdd = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const trimmedName = name.trim();
    const { data, error } = await insertWithOptionalSlug("brands", {
      name: trimmedName,
      slug: slugify(trimmedName),
      letter: trimmedName.charAt(0).toUpperCase(),
      gradient: "from-blue-500 to-cyan-500",
      service_type: serviceType,
    } as any);
    if (!error && data) {
      let finalUrl = imageUrl;
      if (image) finalUrl = await uploadServiceImage("brand-images", data.id, image);
      if (finalUrl) await dataClient.from("brands").update({ image_url: finalUrl }).eq("id", data.id);
      setBrands((current) =>
        sortBrandsForAdmin([
          ...current,
          {
            ...data,
            image_url: finalUrl ?? data.image_url ?? null,
          } as Brand,
        ]),
      );
    }
    if (error) toast.error(error.message); else { await revalidateBrandPages(serviceType); toast.success("Brand added"); reset(); }
    setSaving(false);
  };

  const openEdit = (b: Brand) => {
    setEditBrand(b);
    setEditName(b.name);
    setEditImagePreview(b.image_url);
    setEditImage(null);
    setEditImageUrl(null);
  };

  const openMove = (brand: Brand, currentIndex: number) => {
    setMoveBrand(brand);
    setMovePosition(String(currentIndex + 1));
  };

  const handleEdit = async () => {
    if (!editBrand || !editName.trim()) return;
    setEditSaving(true);
    const trimmedName = editName.trim();
    const updates: any = { name: trimmedName, slug: slugify(trimmedName), letter: trimmedName.charAt(0).toUpperCase() };
    if (editImageUrl) updates.image_url = editImageUrl;
    else if (editImage) {
      const url = await uploadServiceImage("brand-images", editBrand.id, editImage);
      if (url) updates.image_url = url;
    }
    const { error } = await updateWithOptionalSlug("brands", editBrand.id, updates);
    if (error) {
      toast.error(error.message);
      setEditSaving(false);
      return;
    }
    await revalidateBrandPages(serviceType);
    setBrands((current) => sortBrandsForAdmin(current.map((brand) => (brand.id === editBrand.id ? { ...brand, ...updates } : brand))));
    toast.success("Updated"); setEditBrand(null);
    setEditSaving(false);
  };

  const handleDelete = async (id: string) => {
    await (dataClient.from("brands" as any) as any).delete().eq("id", id);
    await revalidateBrandPages(serviceType);
    setBrands((current) => current.filter((brand) => brand.id !== id)); toast.success("Deleted");
  };

  const handleMove = async () => {
    if (!moveBrand || brands.length === 0) return;

    const parsedPosition = Number.parseInt(movePosition, 10);
    if (Number.isNaN(parsedPosition)) {
      toast.error("Enter a valid position");
      return;
    }

    const targetIndex = Math.min(Math.max(parsedPosition, 1), brands.length) - 1;
    const currentIndex = brands.findIndex((brand) => brand.id === moveBrand.id);

    if (currentIndex === -1) {
      toast.error("Brand not found");
      return;
    }

    if (currentIndex === targetIndex) {
      setMoveBrand(null);
      setMovePosition("");
      return;
    }

    const reorderedBrands = [...brands];
    const [selectedBrand] = reorderedBrands.splice(currentIndex, 1);
    reorderedBrands.splice(targetIndex, 0, selectedBrand);

    setMoveSaving(true);

    const updates = reorderedBrands.map((brand, index) =>
      (dataClient.from("brands") as any).update({ sort_order: index + 1 }).eq("id", brand.id),
    );

    const results = await Promise.all(updates);
    const failed = results.find((result: any) => result.error);

    if (failed?.error) {
      toast.error(failed.error.message || "Unable to move brand");
    } else {
      await revalidateBrandPages(serviceType);
      setBrands(reorderedBrands.map((brand, index) => ({ ...brand, sort_order: index + 1 })));
      toast.success("Brand position updated");
      setMoveBrand(null);
      setMovePosition("");
    }

    setMoveSaving(false);
  };

  const reset = () => { setShowAdd(false); setName(""); setImage(null); setImagePreview(null); setImageUrl(null); };

  return (
    <div>
      <button onClick={() => setShowAdd(true)} className="mb-4 flex items-center gap-1.5 text-xs font-bold text-primary"><Plus className="size-3.5" /> Add {copy.device} brand</button>

      <Modal open={showAdd} onClose={reset} title={`Add ${copy.label} Brand`}>
        <div className="space-y-3">
          <input placeholder={`${copy.device === "phone" ? "Phone" : "Laptop"} brand name`} value={name} onChange={(e) => setName(e.target.value)} autoFocus className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <ImageUpload
            preview={imagePreview || imageUrl}
            onFileSelect={(f) => { setImage(f); setImagePreview(URL.createObjectURL(f)); setImageUrl(null); }}
            onUrlSet={(url) => { setImageUrl(url); setImagePreview(null); setImage(null); }}
            onClear={() => { setImage(null); setImagePreview(null); setImageUrl(null); }}
            label="Upload brand logo"
          />
          <button onClick={handleAdd} disabled={saving} className="w-full py-2.5 rounded-xl gradient-brand text-primary-foreground text-xs font-bold disabled:opacity-60 flex items-center justify-center gap-1.5">
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} Add Brand
          </button>
        </div>
      </Modal>

      <Modal open={!!editBrand} onClose={() => setEditBrand(null)} title="Edit Brand">
        <div className="space-y-3">
          <input placeholder="Brand name" value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <ImageUpload
            preview={editImagePreview || editImageUrl}
            onFileSelect={(f) => { setEditImage(f); setEditImagePreview(URL.createObjectURL(f)); setEditImageUrl(null); }}
            onUrlSet={(url) => { setEditImageUrl(url); setEditImagePreview(null); setEditImage(null); }}
            onClear={() => { setEditImage(null); setEditImagePreview(null); setEditImageUrl(null); }}
            label="Change logo"
          />
          <button onClick={handleEdit} disabled={editSaving} className="w-full py-2.5 rounded-xl gradient-brand text-primary-foreground text-xs font-bold disabled:opacity-60 flex items-center justify-center gap-1.5">
            {editSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />} Save Changes
          </button>
        </div>
      </Modal>

      <Modal
        open={!!moveBrand}
        onClose={() => {
          if (moveSaving) return;
          setMoveBrand(null);
          setMovePosition("");
        }}
        title="Move Brand"
      >
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground">
            {moveBrand ? `Move ${moveBrand.name} to a new position in the brand list.` : ""}
          </div>
          <input
            type="number"
            min={1}
            max={brands.length || 1}
            value={movePosition}
            onChange={(e) => setMovePosition(e.target.value)}
            autoFocus
            placeholder={`1 - ${brands.length}`}
            className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            onClick={handleMove}
            disabled={moveSaving || !movePosition.trim()}
            className="w-full py-2.5 rounded-xl gradient-brand text-primary-foreground text-xs font-bold disabled:opacity-60 flex items-center justify-center gap-1.5"
          >
            {moveSaving ? <Loader2 className="size-3.5 animate-spin" /> : <GripVertical className="size-3.5" />} Move Brand
          </button>
        </div>
      </Modal>

      {brands.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground"><Shield className="size-8 mx-auto mb-2 opacity-30" /><p className="text-sm font-semibold">No {copy.device} brands yet</p></div>
      ) : (
        <div className="space-y-2">
          {brands.map((b, index) => (
            <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
              {b.image_url ? <img src={b.image_url} alt={b.name} className="size-8 rounded-lg object-contain flex-shrink-0" /> : <div className="size-8 rounded-lg bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground flex-shrink-0">{b.name.charAt(0)}</div>}
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-foreground truncate block">{b.name}</span>
                <span className="text-[10px] font-semibold text-muted-foreground">Position {index + 1}</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => openMove(b, index)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary" title="Move brand">
                  <GripVertical className="size-3.5" />
                </button>
                <button onClick={() => openEdit(b)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"><Pencil className="size-3.5" /></button>
                <button onClick={() => handleDelete(b.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"><Trash2 className="size-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Series Tab ─────────────────────────────
const SeriesTab = ({ serviceType = "mobile" }: { serviceType?: CatalogServiceType }) => {
  const copy = serviceCopy[serviceType];
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [addImage, setAddImage] = useState<File | null>(null);
  const [addImagePreview, setAddImagePreview] = useState<string | null>(null);
  const [addImageUrl, setAddImageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editItem, setEditItem] = useState<Series | null>(null);
  const [editName, setEditName] = useState("");
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editImageUrl, setEditImageUrl] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => { dataClient.from("brands").select("*").eq("service_type", serviceType).order("name").then(({ data }) => { if (data) setBrands(data as Brand[]); }); }, [serviceType]);

  const fetchSeries = async (brandId: string) => {
    const { data } = await dataClient.from("series").select("*").eq("brand_id", brandId).order("name");
    if (data) setSeriesList(data as any);
  };

  useEffect(() => { if (selectedBrand) fetchSeries(selectedBrand); else setSeriesList([]); }, [selectedBrand]);

  const handleAdd = async () => {
    if (!name.trim() || !selectedBrand) return;
    setSaving(true);
    const trimmedName = name.trim();
    const insertData: any = { brand_id: selectedBrand, name: trimmedName, slug: slugify(trimmedName) };
    if (addImageUrl) insertData.image_url = addImageUrl;
    const { data, error } = await insertWithOptionalSlug("series", insertData);
    let finalUrl = addImageUrl;
    if (!error && data && addImage) {
      finalUrl = await uploadServiceImage("service-images", `series-${data.id}`, addImage);
      if (finalUrl) await (dataClient.from("series") as any).update({ image_url: finalUrl }).eq("id", data.id);
    }
    if (error) toast.error(error.message); else {
      setSeriesList((current) => sortByName([...current, { ...(data as Series), image_url: finalUrl ?? (data as Series).image_url ?? null }]));
      await revalidateCatalogMutation(serviceType, { exactPaths: await getSeriesRevalidationPaths(data.id, serviceType) });
      toast.success("Series added"); setShowAdd(false); setName(""); setAddImage(null); setAddImagePreview(null); setAddImageUrl(null);
    }
    setSaving(false);
  };

  const openEdit = (s: Series) => {
    setEditItem(s); setEditName(s.name); setEditImagePreview(s.image_url || null); setEditImage(null); setEditImageUrl(null);
  };

  const handleEdit = async () => {
    if (!editItem || !editName.trim()) return;
    setEditSaving(true);
    const trimmedName = editName.trim();
    const updates: any = { name: trimmedName, slug: slugify(trimmedName) };
    if (editImageUrl) updates.image_url = editImageUrl;
    else if (editImage) {
      const url = await uploadServiceImage("service-images", `series-${editItem.id}`, editImage);
      if (url) updates.image_url = url;
    }
    const { error } = await updateWithOptionalSlug("series", editItem.id, updates);
    if (error) {
      toast.error(error.message);
      setEditSaving(false);
      return;
    }
    setSeriesList((current) => sortByName(current.map((series) => (series.id === editItem.id ? { ...series, ...updates } : series))));
    await revalidateCatalogMutation(serviceType, { exactPaths: await getSeriesRevalidationPaths(editItem.id, serviceType) });
    toast.success("Updated"); setEditItem(null);
    setEditSaving(false);
  };

  const handleDelete = async (id: string) => {
    await (dataClient.from("series" as any) as any).delete().eq("id", id);
    await revalidateCatalogMutation(serviceType);
    setSeriesList((current) => current.filter((series) => series.id !== id)); toast.success("Deleted");
  };

  return (
    <div>
      <div className="mb-4">
        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Select {copy.device} brand</label>
        <div className="relative">
          <select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none">
            <option value="">{copy.brandPlaceholder}</option>
            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {selectedBrand && <button onClick={() => setShowAdd(true)} className="mb-4 flex items-center gap-1.5 text-xs font-bold text-primary"><Plus className="size-3.5" /> Add {copy.device} series</button>}

      <Modal open={showAdd} onClose={() => { setShowAdd(false); setName(""); setAddImage(null); setAddImagePreview(null); setAddImageUrl(null); }} title={`Add ${copy.label} Series`}>
        <div className="space-y-3">
          <input placeholder={`${copy.device === "phone" ? "Phone" : "Laptop"} series name`} value={name} onChange={(e) => setName(e.target.value)} autoFocus className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <ImageUpload
            preview={addImagePreview || addImageUrl}
            onFileSelect={(f) => { setAddImage(f); setAddImagePreview(URL.createObjectURL(f)); setAddImageUrl(null); }}
            onUrlSet={(url) => { setAddImageUrl(url); setAddImagePreview(null); setAddImage(null); }}
            onClear={() => { setAddImage(null); setAddImagePreview(null); setAddImageUrl(null); }}
            label="Upload series image"
          />
          <button onClick={handleAdd} disabled={saving} className="w-full py-2.5 rounded-xl gradient-brand text-primary-foreground text-xs font-bold disabled:opacity-60 flex items-center justify-center gap-1.5">
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} Add Series
          </button>
        </div>
      </Modal>

      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Series">
        <div className="space-y-3">
          <input placeholder="Series name" value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <ImageUpload
            preview={editImagePreview || editImageUrl}
            onFileSelect={(f) => { setEditImage(f); setEditImagePreview(URL.createObjectURL(f)); setEditImageUrl(null); }}
            onUrlSet={(url) => { setEditImageUrl(url); setEditImagePreview(null); setEditImage(null); }}
            onClear={() => { setEditImage(null); setEditImagePreview(null); setEditImageUrl(null); }}
            label="Change image"
          />
          <button onClick={handleEdit} disabled={editSaving} className="w-full py-2.5 rounded-xl gradient-brand text-primary-foreground text-xs font-bold disabled:opacity-60 flex items-center justify-center gap-1.5">
            {editSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />} Save Changes
          </button>
        </div>
      </Modal>

      {!selectedBrand ? <p className="text-xs text-muted-foreground text-center py-8">Select a {copy.device} brand first</p> : seriesList.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground"><Layers className="size-8 mx-auto mb-2 opacity-30" /><p className="text-sm font-semibold">No {copy.device} series yet</p></div>
      ) : (
        <div className="space-y-2">
          {seriesList.map((s) => (
            <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
              {s.image_url ? <img src={s.image_url} alt={s.name} className="size-8 rounded-lg object-contain flex-shrink-0" /> : <div className="size-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0"><Layers className="size-4 text-muted-foreground" /></div>}
              <span className="flex-1 text-sm font-semibold text-foreground truncate">{s.name}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"><Pencil className="size-3.5" /></button>
                <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"><Trash2 className="size-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Models Tab ─────────────────────────────
const ModelsTab = ({ serviceType = "mobile" }: { serviceType?: CatalogServiceType }) => {
  const copy = serviceCopy[serviceType];
  const DeviceIcon = serviceType === "laptop" ? Laptop : Smartphone;
  const [brands, setBrands] = useState<Brand[]>([]);
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedSeries, setSelectedSeries] = useState("");
  const [models, setModels] = useState<Model[]>([]);
  const [modelSearch, setModelSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [addImage, setAddImage] = useState<File | null>(null);
  const [addImagePreview, setAddImagePreview] = useState<string | null>(null);
  const [addImageUrl, setAddImageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editItem, setEditItem] = useState<Model | null>(null);
  const [editName, setEditName] = useState("");
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editImageUrl, setEditImageUrl] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => { dataClient.from("brands").select("*").eq("service_type", serviceType).order("name").then(({ data }) => { if (data) setBrands(data as Brand[]); }); }, [serviceType]);
  useEffect(() => { if (selectedBrand) { dataClient.from("series").select("*").eq("brand_id", selectedBrand).order("name").then(({ data }) => { if (data) setSeriesList(data as any); }); } else { setSeriesList([]); } setSelectedSeries(""); setModelSearch(""); }, [selectedBrand]);

  const fetchModels = async (seriesId: string) => {
    const { data } = await dataClient.from("models").select("*").eq("series_id", seriesId).order("name");
    if (data) setModels(data as any);
  };

  useEffect(() => { if (selectedSeries) fetchModels(selectedSeries); else setModels([]); setModelSearch(""); }, [selectedSeries]);

  const filteredModels = useMemo(() => {
    const query = normalizeSearchValue(modelSearch);
    if (!query) return models;

    const terms = query.split(" ").filter(Boolean);
    return models.filter((model) => {
      const searchableName = normalizeSearchValue(model.name);
      return terms.every((term) => searchableName.includes(term));
    });
  }, [modelSearch, models]);

  const handleAdd = async () => {
    if (!name.trim() || !selectedSeries) return;
    setSaving(true);
    const trimmedName = name.trim();
    const insertData: any = { series_id: selectedSeries, name: trimmedName, slug: slugify(trimmedName) };
    if (addImageUrl) insertData.image_url = addImageUrl;
    const { data, error } = await insertWithOptionalSlug("models", insertData);
    let finalUrl = addImageUrl;
    if (!error && data && addImage) {
      finalUrl = await uploadServiceImage("service-images", `model-${data.id}`, addImage);
      if (finalUrl) await (dataClient.from("models") as any).update({ image_url: finalUrl }).eq("id", data.id);
    }
    if (error) toast.error(error.message); else {
      setModels((current) => sortByName([...current, { ...(data as Model), image_url: finalUrl ?? (data as Model).image_url ?? null }]));
      await revalidateCatalogMutation(serviceType, { exactPaths: await getModelRevalidationPaths(data.id, serviceType) });
      toast.success("Model added"); setShowAdd(false); setName(""); setAddImage(null); setAddImagePreview(null); setAddImageUrl(null);
    }
    setSaving(false);
  };

  const openEdit = (m: Model) => {
    setEditItem(m); setEditName(m.name); setEditImagePreview(m.image_url || null); setEditImage(null); setEditImageUrl(null);
  };

  const handleEdit = async () => {
    if (!editItem || !editName.trim()) return;
    setEditSaving(true);
    const trimmedName = editName.trim();
    const updates: any = { name: trimmedName, slug: slugify(trimmedName) };
    if (editImageUrl) updates.image_url = editImageUrl;
    else if (editImage) {
      const url = await uploadServiceImage("service-images", `model-${editItem.id}`, editImage);
      if (url) updates.image_url = url;
    }
    const { error } = await updateWithOptionalSlug("models", editItem.id, updates);
    if (error) {
      toast.error(error.message);
      setEditSaving(false);
      return;
    }
    setModels((current) => sortByName(current.map((model) => (model.id === editItem.id ? { ...model, ...updates } : model))));
    await revalidateCatalogMutation(serviceType, { exactPaths: await getModelRevalidationPaths(editItem.id, serviceType) });
    toast.success("Updated"); setEditItem(null);
    setEditSaving(false);
  };

  const handleDelete = async (id: string) => {
    await (dataClient.from("models" as any) as any).delete().eq("id", id);
    await revalidateCatalogMutation(serviceType);
    setModels((current) => current.filter((model) => model.id !== id)); toast.success("Deleted");
  };

  const handleImportFile = async (file: File) => {
    setImporting(true);

    try {
      const rows = await parseModelImageImportFile(file);
      const validRows = rows.filter((row) => row.modelName || row.imageUrl);

      if (validRows.length === 0) {
        toast.error("The uploaded sheet is empty.");
        return;
      }

      const serviceBrandIds = brands.map((brand) => brand.id);
      if (serviceBrandIds.length === 0) {
        toast.error(`Add a ${copy.device} brand before importing model images.`);
        return;
      }

      const { data: serviceSeries, error: seriesError } = await dataClient
        .from("series")
        .select("id")
        .in("brand_id", serviceBrandIds);
      if (seriesError || !serviceSeries) {
        toast.error(seriesError?.message || "Unable to load series for import.");
        return;
      }

      const serviceSeriesIds = (serviceSeries as Array<{ id: string }>).map((series) => series.id);
      if (serviceSeriesIds.length === 0) {
        toast.error(`Add ${copy.device} series before importing model images.`);
        return;
      }

      const { data: allModels, error: modelsError } = await dataClient.from("models").select("id, name, series_id").in("series_id", serviceSeriesIds);
      if (modelsError || !allModels) {
        toast.error(modelsError?.message || "Unable to load models for import.");
        return;
      }

      const modelMatches = new Map<string, Array<{ id: string; name: string; series_id: string }>>();
      for (const model of allModels as Array<{ id: string; name: string; series_id: string }>) {
        const key = normalizeGuardKey(model.name);
        modelMatches.set(key, [...(modelMatches.get(key) || []), model]);
      }

      const touchedModelIds = new Set<string>();
      let updatedCount = 0;
      const skipped: string[] = [];

      for (const [index, row] of validRows.entries()) {
        if (!row.modelName || !row.imageUrl) {
          skipped.push(`Row ${index + 2}: missing Model or Image URL`);
          continue;
        }

        const matches = modelMatches.get(normalizeGuardKey(row.modelName)) || [];
        if (matches.length === 0) {
          skipped.push(`Row ${index + 2}: model "${row.modelName}" not found`);
          continue;
        }

        const scopedMatches = selectedSeries ? matches.filter((model) => model.series_id === selectedSeries) : matches;
        if (scopedMatches.length === 0) {
          skipped.push(`Row ${index + 2}: model "${row.modelName}" is outside the selected series`);
          continue;
        }
        if (scopedMatches.length > 1) {
          skipped.push(`Row ${index + 2}: model "${row.modelName}" matched multiple records`);
          continue;
        }

        const model = scopedMatches[0];
        const { error } = await (dataClient.from("models") as any).update({ image_url: row.imageUrl }).eq("id", model.id);
        if (error) {
          skipped.push(`Row ${index + 2}: ${error.message}`);
          continue;
        }

        updatedCount += 1;
        touchedModelIds.add(model.id);
      }

      if (touchedModelIds.size > 0) {
        const exactPaths = (
          await Promise.all(Array.from(touchedModelIds).map((modelId) => getModelRevalidationPaths(modelId, serviceType)))
        ).flat();
        await revalidateCatalogMutation(serviceType, { exactPaths });
      }

      if (selectedSeries) {
        await fetchModels(selectedSeries);
      }

      if (updatedCount) {
        toast.success(`Import complete: ${updatedCount} model image${updatedCount === 1 ? "" : "s"} updated${skipped.length ? `, ${skipped.length} skipped` : ""}.`);
      } else {
        toast.error(skipped[0] || "No rows were imported.");
      }

      if (skipped.length) {
        console.warn("Model image import skipped rows:", skipped);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to import this file.");
    } finally {
      setImporting(false);
      if (importInputRef.current) {
        importInputRef.current.value = "";
      }
    }
  };

  return (
    <div>
      <div className="mb-4 rounded-2xl border border-border bg-card p-4 shadow-card-brand">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-black text-foreground">Bulk Import {copy.device} Model Images</div>
            <p className="mt-1 text-xs text-muted-foreground">Imports only match models inside the {copy.label} catalog.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={downloadModelImageTemplate} type="button" className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold text-foreground transition-colors hover:border-primary/30 hover:text-primary">
              <Download className="size-3.5" /> Download Template
            </button>
            <button onClick={() => importInputRef.current?.click()} type="button" disabled={importing} className="inline-flex items-center gap-1.5 rounded-xl gradient-brand px-3 py-2 text-xs font-bold text-primary-foreground disabled:opacity-60">
              {importing ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />} Upload Sheet
            </button>
            <input
              ref={importInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void handleImportFile(file);
                }
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{copy.device === "phone" ? "Phone" : "Laptop"} Brand</label>
          <div className="relative">
            <select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none">
              <option value="">{copy.brandPlaceholder}</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{copy.device === "phone" ? "Phone" : "Laptop"} Series</label>
          <div className="relative">
            <select value={selectedSeries} onChange={(e) => setSelectedSeries(e.target.value)} disabled={!selectedBrand} className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none disabled:opacity-50">
              <option value="">{copy.seriesPlaceholder}</option>
              {seriesList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      {selectedSeries && (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 text-xs font-bold text-primary"><Plus className="size-3.5" /> Add {copy.device} model</button>
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={modelSearch}
              onChange={(e) => setModelSearch(e.target.value)}
              placeholder={`Search ${copy.device} model in this series...`}
              className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-9 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {modelSearch && (
              <button
                type="button"
                onClick={() => setModelSearch("")}
                className="absolute right-2 top-1/2 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                aria-label="Clear model search"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      <Modal open={showAdd} onClose={() => { setShowAdd(false); setName(""); setAddImage(null); setAddImagePreview(null); setAddImageUrl(null); }} title={`Add ${copy.label} Model`}>
        <div className="space-y-3">
          <input placeholder={`${copy.device === "phone" ? "Phone" : "Laptop"} model name`} value={name} onChange={(e) => setName(e.target.value)} autoFocus className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <ImageUpload
            preview={addImagePreview || addImageUrl}
            onFileSelect={(f) => { setAddImage(f); setAddImagePreview(URL.createObjectURL(f)); setAddImageUrl(null); }}
            onUrlSet={(url) => { setAddImageUrl(url); setAddImagePreview(null); setAddImage(null); }}
            onClear={() => { setAddImage(null); setAddImagePreview(null); setAddImageUrl(null); }}
            label="Upload model image"
          />
          <button onClick={handleAdd} disabled={saving} className="w-full py-2.5 rounded-xl gradient-brand text-primary-foreground text-xs font-bold disabled:opacity-60 flex items-center justify-center gap-1.5">
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} Add Model
          </button>
        </div>
      </Modal>

      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Model">
        <div className="space-y-3">
          <input placeholder="Model name" value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <ImageUpload
            preview={editImagePreview || editImageUrl}
            onFileSelect={(f) => { setEditImage(f); setEditImagePreview(URL.createObjectURL(f)); setEditImageUrl(null); }}
            onUrlSet={(url) => { setEditImageUrl(url); setEditImagePreview(null); setEditImage(null); }}
            onClear={() => { setEditImage(null); setEditImagePreview(null); setEditImageUrl(null); }}
            label="Change image"
          />
          <button onClick={handleEdit} disabled={editSaving} className="w-full py-2.5 rounded-xl gradient-brand text-primary-foreground text-xs font-bold disabled:opacity-60 flex items-center justify-center gap-1.5">
            {editSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />} Save Changes
          </button>
        </div>
      </Modal>

      {!selectedSeries ? <p className="text-xs text-muted-foreground text-center py-8">{!selectedBrand ? `Select ${copy.device} brand & series` : `Select a ${copy.device} series`}</p> : models.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground"><DeviceIcon className="size-8 mx-auto mb-2 opacity-30" /><p className="text-sm font-semibold">No {copy.device} models yet</p></div>
      ) : filteredModels.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="size-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm font-semibold">No matching {copy.device} models</p>
          <p className="mt-1 text-xs">Try a different model name in this series.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredModels.map((m) => (
            <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
              {m.image_url ? <img src={m.image_url} alt={m.name} className="size-8 rounded-lg object-contain flex-shrink-0" /> : <div className="size-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0"><DeviceIcon className="size-4 text-muted-foreground" /></div>}
              <span className="flex-1 text-sm font-semibold text-foreground truncate">{m.name}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"><Pencil className="size-3.5" /></button>
                <button onClick={() => handleDelete(m.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"><Trash2 className="size-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const DeviceGuardsManageTab = () => {
  const [categories, setCategories] = useState<GuardCategory[]>([]);
  const [types, setTypes] = useState<GuardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState("");
  const [showAddCat, setShowAddCat] = useState(false);
  const [showAddType, setShowAddType] = useState(false);
  const [catName, setCatName] = useState("");
  const [typeName, setTypeName] = useState("");
  const [typePrice, setTypePrice] = useState("");
  const [typeImage, setTypeImage] = useState<File | null>(null);
  const [typeImagePreview, setTypeImagePreview] = useState<string | null>(null);
  const [typeImageUrl, setTypeImageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editTypeId, setEditTypeId] = useState<string | null>(null);
  const [editTypeName, setEditTypeName] = useState("");
  const [editTypePrice, setEditTypePrice] = useState("");
  const [showEditType, setShowEditType] = useState(false);
  const [editTypeImage, setEditTypeImage] = useState<File | null>(null);
  const [editTypeImagePreview, setEditTypeImagePreview] = useState<string | null>(null);
  const [editTypeImageUrl, setEditTypeImageUrl] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    const { data } = await dataClient.from("screen_guard_categories").select("*").order("name");
    if (data) setCategories(data);
    setLoading(false);
  };

  const fetchTypes = async (catId: string) => {
    const { data } = await dataClient.from("screen_guard_types").select("*").eq("category_id", catId).order("name");
    if (data) setTypes(data as GuardType[]);
  };

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => { if (selectedCat) fetchTypes(selectedCat); else setTypes([]); }, [selectedCat]);

  const uploadTypeImage = async (id: string, file: File) => {
    const optimizedFile = await convertFileToWebp(file);
    const path = `${id}.webp`;
    const { error } = await dataClient.storage.from("guard-type-images").upload(path, optimizedFile, {
      upsert: true,
      contentType: "image/webp",
      cacheControl: "31536000",
    });
    if (error) return null;
    return dataClient.storage.from("guard-type-images").getPublicUrl(path).data.publicUrl;
  };

  const getAssignedModelIdsForGuardType = async (guardType: string) => {
    const { data } = await (dataClient.from("model_screen_guards") as any)
      .select("model_id")
      .eq("guard_type", guardType);

    return Array.from(new Set((data || []).map((row: { model_id: string }) => row.model_id).filter(Boolean)));
  };

  const revalidateAssignedGuardModels = async (modelIds: string[]) => {
    const uniqueModelIds = Array.from(new Set(modelIds.filter(Boolean)));
    if (uniqueModelIds.length === 0) return;

    const pathGroups = await Promise.all(uniqueModelIds.map((modelId) => getModelRevalidationPaths(modelId, "mobile")));
    await revalidateCatalogMutation("mobile", { exactPaths: pathGroups.flat() });
  };

  const syncAssignedGuardType = async (previousName: string, updates: { name: string; price: number; image_url?: string | null }) => {
    const { data: rowsToUpdate, error: fetchError } = await (dataClient.from("model_screen_guards") as any)
      .select("id, model_id")
      .eq("guard_type", previousName);

    if (fetchError) {
      console.error("Failed to fetch assigned guards for sync:", fetchError);
      throw fetchError;
    }
      
    if (!rowsToUpdate || rowsToUpdate.length === 0) return;

    const rowIds = rowsToUpdate.map((r: { id: string }) => r.id);
    const modelIds = Array.from(new Set(rowsToUpdate.map((r: { model_id: string }) => r.model_id)));

    const assignedUpdates: { guard_type: string; price: number; image_url?: string | null } = {
      guard_type: updates.name,
      price: updates.price,
    };

    if (Object.prototype.hasOwnProperty.call(updates, "image_url")) {
      assignedUpdates.image_url = updates.image_url ?? null;
    }

    let { error } = await (dataClient.from("model_screen_guards") as any)
      .update(assignedUpdates)
      .in("id", rowIds);

    const missingImageUrlColumn =
      error?.message?.includes("image_url") &&
      error.message.includes("model_screen_guards");

    if (missingImageUrlColumn) {
      const fallbackResult = await (dataClient.from("model_screen_guards") as any)
        .update({ guard_type: updates.name, price: updates.price })
        .in("id", rowIds);
      error = fallbackResult.error;
    }

    if (error) {
      console.error("Failed to sync assigned guards:", error);
      throw error;
    }
    
    await revalidateAssignedGuardModels(modelIds as string[]);
  };

  const addTypeToModelsWithCategoryAssigned = async (guardType: GuardType) => {
    const existingTypeNames = types.map((type) => type.name).filter(Boolean);
    if (existingTypeNames.length === 0) return;

    const { data: categoryAssignments } = await (dataClient.from("model_screen_guards") as any)
      .select("model_id")
      .in("guard_type", existingTypeNames);

    const modelIds = Array.from(new Set((categoryAssignments || []).map((row: { model_id: string }) => row.model_id).filter(Boolean)));
    if (modelIds.length === 0) return;

    const { data: existingNewAssignments } = await (dataClient.from("model_screen_guards") as any)
      .select("model_id")
      .eq("guard_type", guardType.name)
      .in("model_id", modelIds);

    const alreadyAssigned = new Set((existingNewAssignments || []).map((row: { model_id: string }) => row.model_id));
    const inserts = modelIds
      .filter((modelId) => !alreadyAssigned.has(modelId))
      .map((modelId) => ({
        model_id: modelId,
        guard_type: guardType.name,
        image_url: guardType.image_url,
        price: guardType.price,
      }));

    if (inserts.length === 0) return;

    let { error } = await (dataClient.from("model_screen_guards") as any).insert(inserts);

    const missingImageUrlColumn =
      error?.message?.includes("image_url") &&
      error.message.includes("model_screen_guards");

    if (missingImageUrlColumn) {
      const fallbackResult = await (dataClient.from("model_screen_guards") as any).insert(
        inserts.map(({ image_url, ...insert }) => insert),
      );
      error = fallbackResult.error;
    }

    if (error) throw error;
    await revalidateAssignedGuardModels(inserts.map((insert) => insert.model_id) as string[]);
  };

  const handleAddCat = async () => {
    if (!catName.trim()) return;
    setSaving(true);
    const { error } = await dataClient.from("screen_guard_categories").insert({ name: catName.trim() });
    if (error) toast.error(error.message); else { toast.success("Category added"); setShowAddCat(false); setCatName(""); fetchCategories(); }
    setSaving(false);
  };

  const handleEditCat = async (id: string) => {
    if (!editCatName.trim()) return;
    await (dataClient.from("screen_guard_categories" as any) as any).update({ name: editCatName.trim() }).eq("id", id);
    setEditCatId(null); fetchCategories(); toast.success("Updated");
  };

  const handleDeleteCat = async (id: string) => {
    await (dataClient.from("screen_guard_categories" as any) as any).delete().eq("id", id);
    if (selectedCat === id) { setSelectedCat(""); setTypes([]); }
    fetchCategories(); toast.success("Deleted");
  };

  const handleAddType = async () => {
    if (!typeName.trim() || !selectedCat) return;
    setSaving(true);
    const insertData: any = { category_id: selectedCat, name: typeName.trim(), price: typePrice ? parseFloat(typePrice) : 0 };
    if (typeImageUrl) insertData.image_url = typeImageUrl;
    const { data, error } = await (dataClient.from("screen_guard_types") as any).insert(insertData).select().single();
    let savedType = data as GuardType | null;
    if (!error && data && typeImage) {
      const url = await uploadTypeImage(data.id, typeImage);
      if (url) {
        await (dataClient.from("screen_guard_types" as any) as any).update({ image_url: url }).eq("id", data.id);
        savedType = { ...(data as GuardType), image_url: url };
      }
    }
    if (error) toast.error(error.message); else {
      try {
        if (savedType) await addTypeToModelsWithCategoryAssigned(savedType);
        toast.success("Type added");
        resetTypeForm();
        fetchTypes(selectedCat);
      } catch (syncError: any) {
        toast.error(syncError.message || "Type added, but assigned models were not updated");
      }
    }
    setSaving(false);
  };

  const resetTypeForm = () => {
    setShowAddType(false); setTypeName(""); setTypePrice(""); setTypeImage(null); setTypeImagePreview(null); setTypeImageUrl(null);
  };

  const handleDeleteType = async (id: string) => {
    const typeToDelete = types.find((type) => type.id === id);
    const modelIds = typeToDelete ? await getAssignedModelIdsForGuardType(typeToDelete.name) : [];
    await (dataClient.from("screen_guard_types" as any) as any).delete().eq("id", id);
    if (typeToDelete) {
      await (dataClient.from("model_screen_guards" as any) as any).delete().eq("guard_type", typeToDelete.name);
      await revalidateAssignedGuardModels(modelIds as string[]);
    }
    fetchTypes(selectedCat); toast.success("Deleted");
  };

  const openEditType = (t: GuardType) => {
    setEditTypeId(t.id); setEditTypeName(t.name); setEditTypePrice(String(t.price));
    setEditTypeImagePreview(t.image_url); setEditTypeImage(null); setEditTypeImageUrl(null); setShowEditType(true);
  };

  const handleEditType = async () => {
    if (!editTypeId || !editTypeName.trim()) return;
    const previousType = types.find((type) => type.id === editTypeId);
    setEditSaving(true);
    const updates: any = { name: editTypeName.trim(), price: editTypePrice ? parseFloat(editTypePrice) : 0 };
    if (editTypeImageUrl) updates.image_url = editTypeImageUrl;
    else if (editTypeImage) {
      const url = await uploadTypeImage(editTypeId, editTypeImage);
      if (url) updates.image_url = url;
    }
    const { error } = await (dataClient.from("screen_guard_types" as any) as any).update(updates).eq("id", editTypeId);
    if (error) {
      toast.error(error.message);
      setEditSaving(false);
      return;
    }

    try {
      if (previousType) await syncAssignedGuardType(previousType.name, updates);
      toast.success("Updated");
      setShowEditType(false);
      setEditTypeId(null);
      fetchTypes(selectedCat);
    } catch (syncError: any) {
      toast.error(syncError.message || "Type updated, but assigned models were not updated");
    }
    setEditSaving(false);
  };

  return (
    <div>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-foreground">Device Guard Categories</span>
          <button onClick={() => setShowAddCat(true)} className="flex items-center gap-1 text-[10px] font-bold text-primary"><Plus className="size-3" /> Add Category</button>
        </div>

        <Modal open={showAddCat} onClose={() => { setShowAddCat(false); setCatName(""); }} title="Add Category">
          <div className="space-y-3">
            <input placeholder="Category name (e.g. Flat Screen)" value={catName} onChange={(e) => setCatName(e.target.value)} autoFocus className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <button onClick={handleAddCat} disabled={saving} className="w-full py-2.5 rounded-xl gradient-brand text-primary-foreground text-xs font-bold disabled:opacity-60 flex items-center justify-center gap-1.5">
              {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} Add Category
            </button>
          </div>
        </Modal>

        {loading ? <div className="flex justify-center py-8"><Loader2 className="size-5 animate-spin text-primary" /></div> : categories.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground"><Grid3X3 className="size-8 mx-auto mb-2 opacity-30" /><p className="text-xs font-semibold">No categories yet</p></div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <div key={c.id} className={`relative group flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 cursor-pointer transition-all text-xs font-bold ${selectedCat === c.id ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground hover:border-primary/40"}`}>
                <button onClick={() => setSelectedCat(selectedCat === c.id ? "" : c.id)} className="flex-1 text-left">
                  {editCatId === c.id ? (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <input value={editCatName} onChange={(e) => setEditCatName(e.target.value)} autoFocus onKeyDown={(e) => e.key === "Enter" && handleEditCat(c.id)} className="w-20 text-xs border border-border rounded-lg px-1.5 py-0.5 bg-background text-foreground focus:outline-none" />
                      <button onClick={() => handleEditCat(c.id)} className="text-primary"><Check className="size-3" /></button>
                      <button onClick={() => setEditCatId(null)} className="text-muted-foreground"><X className="size-3" /></button>
                    </div>
                  ) : c.name}
                </button>
                {editCatId !== c.id && (
                  <div className="flex items-center gap-0.5">
                    <button onClick={(e) => { e.stopPropagation(); setEditCatId(c.id); setEditCatName(c.name); }} className="p-0.5 text-muted-foreground hover:text-foreground"><Pencil className="size-2.5" /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteCat(c.id); }} className="p-0.5 text-muted-foreground hover:text-destructive"><Trash2 className="size-2.5" /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedCat && (
        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-foreground">Types in "{categories.find(c => c.id === selectedCat)?.name}"</span>
            <button onClick={() => setShowAddType(true)} className="flex items-center gap-1 text-[10px] font-bold text-primary"><Plus className="size-3" /> Add Type</button>
          </div>

          <Modal open={showAddType} onClose={resetTypeForm} title="Add Guard Type">
            <div className="space-y-3">
              <input placeholder="Type name (e.g. 11D, Privacy, Matte)" value={typeName} onChange={(e) => setTypeName(e.target.value)} autoFocus className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <div>
                <label htmlFor="field-servicestab-1391" className="text-xs font-semibold text-muted-foreground mb-1 block">Price (₹)</label>
                <input id="field-servicestab-1391" type="number" placeholder="99" value={typePrice} onChange={(e) => setTypePrice(e.target.value)} className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <ImageUpload
                preview={typeImagePreview || typeImageUrl}
                onFileSelect={(f) => { setTypeImage(f); setTypeImagePreview(URL.createObjectURL(f)); setTypeImageUrl(null); }}
                onUrlSet={(url) => { setTypeImageUrl(url); setTypeImagePreview(null); setTypeImage(null); }}
                onClear={() => { setTypeImage(null); setTypeImagePreview(null); setTypeImageUrl(null); }}
                label="Upload guard image"
              />
              <button onClick={handleAddType} disabled={saving} className="w-full py-2.5 rounded-xl gradient-brand text-primary-foreground text-xs font-bold disabled:opacity-60 flex items-center justify-center gap-1.5">
                {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} Add Type
              </button>
            </div>
          </Modal>

          <Modal open={showEditType} onClose={() => { setShowEditType(false); setEditTypeId(null); }} title="Edit Guard Type">
            <div className="space-y-3">
              <input placeholder="Type name" value={editTypeName} onChange={(e) => setEditTypeName(e.target.value)} autoFocus className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <div>
                <label htmlFor="field-servicestab-1411" className="text-xs font-semibold text-muted-foreground mb-1 block">Price (₹)</label>
                <input id="field-servicestab-1411" type="number" placeholder="99" value={editTypePrice} onChange={(e) => setEditTypePrice(e.target.value)} className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <ImageUpload
                preview={editTypeImagePreview || editTypeImageUrl}
                onFileSelect={(f) => { setEditTypeImage(f); setEditTypeImagePreview(URL.createObjectURL(f)); setEditTypeImageUrl(null); }}
                onUrlSet={(url) => { setEditTypeImageUrl(url); setEditTypeImagePreview(null); setEditTypeImage(null); }}
                onClear={() => { setEditTypeImage(null); setEditTypeImagePreview(null); setEditTypeImageUrl(null); }}
                label="Change image"
              />
              <button onClick={handleEditType} disabled={editSaving} className="w-full py-2.5 rounded-xl gradient-brand text-primary-foreground text-xs font-bold disabled:opacity-60 flex items-center justify-center gap-1.5">
                {editSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />} Save Changes
              </button>
            </div>
          </Modal>

          {types.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground"><p className="text-xs font-semibold">No types yet</p></div>
          ) : (
            <div className="space-y-2">
              {types.map((t) => (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                  {t.image_url ? <img src={t.image_url} alt={t.name} className="size-8 rounded-lg object-contain flex-shrink-0" /> : <div className="size-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0"><Shield className="size-4 text-muted-foreground" /></div>}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-bold text-foreground">{t.name}</span>
                    <span className="ml-2 text-sm font-extrabold text-primary">₹{t.price}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEditType(t)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"><Pencil className="size-3.5" /></button>
                    <button onClick={() => handleDeleteType(t.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"><Trash2 className="size-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Model Guards Assignment Tab ─────────────────────────────
const ModelGuardsTab = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedSeries, setSelectedSeries] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [guards, setGuards] = useState<Guard[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [categories, setCategories] = useState<GuardCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { dataClient.from("brands").select("*").eq("service_type", "mobile").order("name").then(({ data }) => { if (data) setBrands(data as Brand[]); }); }, []);
  useEffect(() => { dataClient.from("screen_guard_categories").select("*").order("name").then(({ data }) => { if (data) setCategories(data); }); }, []);
  useEffect(() => { if (selectedBrand) { dataClient.from("series").select("*").eq("brand_id", selectedBrand).order("name").then(({ data }) => { if (data) setSeriesList(data as any); }); } else setSeriesList([]); setSelectedSeries(""); }, [selectedBrand]);
  useEffect(() => { if (selectedSeries) { dataClient.from("models").select("*").eq("series_id", selectedSeries).order("name").then(({ data }) => { if (data) setModels(data as any); }); } else setModels([]); setSelectedModel(""); }, [selectedSeries]);

  const loadTypeImageMap = async () => {
    const { data, error } = await dataClient
      .from("screen_guard_types")
      .select("name, image_url");

    if (error || !data) {
      return new Map<string, string>();
    }

    return new Map(
      data
        .filter((item) => typeof item.image_url === "string" && item.image_url.trim())
        .map((item) => [item.name.trim().toLowerCase(), item.image_url!.trim()]),
    );
  };

  const fetchGuards = async (modelId: string) => {
    setLoading(true);
    const typeImageMap = await loadTypeImageMap();
    const primaryQuery = await dataClient
      .from("model_screen_guards")
      .select("*")
      .eq("model_id", modelId)
      .order("guard_type");

    const missingImageUrlColumn =
      primaryQuery.error?.message?.includes("image_url") &&
      primaryQuery.error.message.includes("model_screen_guards");

    if (!primaryQuery.error && primaryQuery.data) {
      setGuards(
        primaryQuery.data.map((guard) => ({
          ...guard,
          image_url: guard.image_url || typeImageMap.get(guard.guard_type.trim().toLowerCase()) || null,
        })),
      );
    } else if (missingImageUrlColumn) {
      const fallbackQuery = await (dataClient.from("model_screen_guards") as any)
        .select("id, model_id, guard_type, price, created_at")
        .eq("model_id", modelId)
        .order("guard_type");

      if (fallbackQuery.data) {
        setGuards(
          fallbackQuery.data.map((guard: any) => ({
            ...guard,
            image_url: typeImageMap.get(guard.guard_type.trim().toLowerCase()) || null,
          })),
        );
      } else {
        setGuards([]);
      }
    } else {
      setGuards([]);
    }

    setLoading(false);
  };

  useEffect(() => { if (selectedModel) fetchGuards(selectedModel); else setGuards([]); }, [selectedModel]);

  const handleAssignCategory = async () => {
    if (!selectedModel || !selectedCategory) return;
    setSaving(true);
    const { data: guardTypes } = await dataClient.from("screen_guard_types").select("*").eq("category_id", selectedCategory).order("name");
    if (!guardTypes || guardTypes.length === 0) { toast.error("No guard types in this category"); setSaving(false); return; }
    const inserts = (guardTypes as GuardType[]).map(t => ({ model_id: selectedModel, guard_type: t.name, image_url: t.image_url, price: t.price }));
    let { error } = await dataClient.from("model_screen_guards").insert(inserts);

    const missingImageUrlColumn =
      error?.message?.includes("image_url") &&
      error.message.includes("model_screen_guards");

    if (missingImageUrlColumn) {
      const fallbackInserts = (guardTypes as GuardType[]).map((t) => ({
        model_id: selectedModel,
        guard_type: t.name,
        price: t.price,
      }));

      const fallbackResult = await (dataClient.from("model_screen_guards") as any).insert(fallbackInserts);
      error = fallbackResult.error;
    }

    if (error) toast.error(error.message); else { await revalidateCatalogMutation("mobile", { exactPaths: await getModelRevalidationPaths(selectedModel, "mobile") }); toast.success(`${inserts.length} guards assigned`); setShowAdd(false); setSelectedCategory(""); fetchGuards(selectedModel); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await (dataClient.from("model_screen_guards" as any) as any).delete().eq("id", id);
    await revalidateCatalogMutation("mobile", { exactPaths: await getModelRevalidationPaths(selectedModel, "mobile") });
    fetchGuards(selectedModel); toast.success("Deleted");
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div>
          <label htmlFor="field-servicestab-1570" className="text-[10px] font-semibold text-muted-foreground mb-1 block">Brand</label>
          <div className="relative">
            <select id="field-servicestab-1570" value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} className="w-full text-xs border border-border rounded-xl p-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none">
              <option value="">Choose&hellip;</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
          </div>
        </div>
        <div>
          <label htmlFor="field-servicestab-1580" className="text-[10px] font-semibold text-muted-foreground mb-1 block">Series</label>
          <div className="relative">
            <select id="field-servicestab-1580" value={selectedSeries} onChange={(e) => setSelectedSeries(e.target.value)} disabled={!selectedBrand} className="w-full text-xs border border-border rounded-xl p-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none disabled:opacity-50">
              <option value="">Choose&hellip;</option>
              {seriesList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
          </div>
        </div>
        <div>
          <label htmlFor="field-servicestab-1590" className="text-[10px] font-semibold text-muted-foreground mb-1 block">Model</label>
          <div className="relative">
            <select id="field-servicestab-1590" value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} disabled={!selectedSeries} className="w-full text-xs border border-border rounded-xl p-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none disabled:opacity-50">
              <option value="">Choose&hellip;</option>
              {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      {selectedModel && <button onClick={() => setShowAdd(true)} className="mb-4 flex items-center gap-1.5 text-xs font-bold text-primary"><Plus className="size-3.5" /> Assign Guards</button>}

      <Modal open={showAdd} onClose={() => { setShowAdd(false); setSelectedCategory(""); }} title="Assign Device Guards">
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Select a category to assign all its guard types with their prices to this model.</p>
          <div>
            <label htmlFor="field-servicestab-1607" className="text-xs font-semibold text-muted-foreground mb-1 block">Category</label>
            <div className="relative">
              <select id="field-servicestab-1607" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none">
                <option value="">Choose category&hellip;</option>
                {sortByPositionThenName(categories).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          <button onClick={handleAssignCategory} disabled={saving || !selectedCategory} className="w-full py-2.5 rounded-xl gradient-brand text-primary-foreground text-xs font-bold disabled:opacity-60 flex items-center justify-center gap-1.5">
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Layers className="size-3.5" />} Assign All Types
          </button>
        </div>
      </Modal>

      {!selectedModel ? <p className="text-xs text-muted-foreground text-center py-8">Select brand, series & model</p> : loading ? <div className="flex justify-center py-12"><Loader2 className="size-5 animate-spin text-primary" /></div> : guards.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground"><Tag className="size-8 mx-auto mb-2 opacity-30" /><p className="text-sm font-semibold">No guards yet</p></div>
      ) : (
        <div className="space-y-2">
          {guards.map((g) => (
            <div key={g.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
              {g.image_url ? <img src={g.image_url} alt={g.guard_type} className="size-8 rounded-lg object-contain flex-shrink-0" /> : <div className="size-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0"><Shield className="size-4 text-muted-foreground" /></div>}
              <div className="flex-1"><span className="text-sm font-bold text-foreground">{g.guard_type}</span><span className="ml-2 text-sm font-extrabold text-primary">₹{g.price}</span></div>
              <button onClick={() => handleDelete(g.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"><Trash2 className="size-3.5" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Repair Categories Tab (for Mobile/Laptop) ─────────────────────────────
type RepairCategory = { id: string; name: string; service_type: string; image_url?: string | null; sort_order?: number | null };

const RepairCategoriesTab = ({ serviceType }: { serviceType: string }) => {
  const [categories, setCategories] = useState<RepairCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [addImage, setAddImage] = useState<File | null>(null);
  const [addImagePreview, setAddImagePreview] = useState<string | null>(null);
  const [addImageUrl, setAddImageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editItem, setEditItem] = useState<RepairCategory | null>(null);
  const [editName, setEditName] = useState("");
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editImageUrl, setEditImageUrl] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [moveItem, setMoveItem] = useState<RepairCategory | null>(null);
  const [movePosition, setMovePosition] = useState("");
  const [moveSaving, setMoveSaving] = useState(false);

  const fetchCats = async () => {
    setLoading(true);
    const { data, error } = await fetchRepairCategoriesForAdmin(serviceType);
    if (data) setCategories(sortByPositionThenName(data as RepairCategory[]));
    if (error) toast.error(error.message);
    setLoading(false);
  };

  useEffect(() => { fetchCats(); }, [serviceType]);

  const handleAdd = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const nextPosition = categories.length + 1;
    const insertData: any = { name: name.trim(), service_type: serviceType, sort_order: nextPosition };
    if (addImageUrl) insertData.image_url = addImageUrl;
    const { data, error } = await insertRepairCatalogRow("repair_categories", insertData);
    if (!error && data && addImage) {
      const url = await uploadServiceImage("service-images", `repair-${data.id}`, addImage);
      if (url) await (dataClient.from("repair_categories") as any).update({ image_url: url }).eq("id", data.id);
    }
    if (error) toast.error(error.message); else { toast.success("Category added"); setShowAdd(false); setName(""); setAddImage(null); setAddImagePreview(null); setAddImageUrl(null); fetchCats(); }
    setSaving(false);
  };

  const openEdit = (c: RepairCategory) => {
    setEditItem(c); setEditName(c.name); setEditImagePreview(c.image_url || null); setEditImage(null); setEditImageUrl(null);
  };

  const handleEdit = async () => {
    if (!editItem || !editName.trim()) return;
    setEditSaving(true);
    const updates: any = { name: editName.trim() };
    if (editImageUrl) updates.image_url = editImageUrl;
    else if (editImage) {
      const url = await uploadServiceImage("service-images", `repair-${editItem.id}`, editImage);
      if (url) updates.image_url = url;
    }
    await (dataClient.from("repair_categories") as any).update(updates).eq("id", editItem.id);
    toast.success("Updated"); setEditItem(null); fetchCats();
    setEditSaving(false);
  };

  const handleDelete = async (id: string) => {
    await (dataClient.from("repair_categories" as any) as any).delete().eq("id", id);
    fetchCats(); toast.success("Deleted");
  };

  const openMove = (category: RepairCategory, currentIndex: number) => {
    setMoveItem(category);
    setMovePosition(String(currentIndex + 1));
  };

  const handleMove = async () => {
    if (!moveItem || categories.length === 0) return;

    const parsedPosition = Number.parseInt(movePosition, 10);
    if (Number.isNaN(parsedPosition)) {
      toast.error("Enter a valid position");
      return;
    }

    const currentItems = sortByPositionThenName(categories);
    const targetIndex = Math.min(Math.max(parsedPosition, 1), currentItems.length) - 1;
    const currentIndex = currentItems.findIndex((category) => category.id === moveItem.id);

    if (currentIndex === -1) {
      toast.error("Category not found");
      return;
    }

    if (currentIndex === targetIndex) {
      setMoveItem(null);
      setMovePosition("");
      return;
    }

    const nextItems = [...currentItems];
    const [movedCategory] = nextItems.splice(currentIndex, 1);
    nextItems.splice(targetIndex, 0, movedCategory);

    setMoveSaving(true);
    const updates = await Promise.all(nextItems.map((category, index) =>
      (dataClient.from("repair_categories") as any).update({ sort_order: index + 1 }).eq("id", category.id),
    ));
    const failed = updates.find((result: any) => result.error);

    if (failed) {
      toast.error(failed.error.message || "Unable to move category");
    } else {
      await revalidateCatalogMutation(serviceType, { extraTags: ["catalog-repairs"] });
      setCategories(nextItems.map((category, index) => ({ ...category, sort_order: index + 1 })));
      toast.success("Category position updated");
      setMoveItem(null);
      setMovePosition("");
    }
    setMoveSaving(false);
  };

  return (
    <div>
      <button onClick={() => setShowAdd(true)} className="mb-4 flex items-center gap-1.5 text-xs font-bold text-primary"><Plus className="size-3.5" /> Add Repair Category</button>

      <Modal open={showAdd} onClose={() => { setShowAdd(false); setName(""); setAddImage(null); setAddImagePreview(null); setAddImageUrl(null); }} title="Add Repair Category">
        <div className="space-y-3">
          <input placeholder="e.g. Screen Replacement" value={name} onChange={(e) => setName(e.target.value)} autoFocus className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <ImageUpload
            preview={addImagePreview || addImageUrl}
            onFileSelect={(f) => { setAddImage(f); setAddImagePreview(URL.createObjectURL(f)); setAddImageUrl(null); }}
            onUrlSet={(url) => { setAddImageUrl(url); setAddImagePreview(null); setAddImage(null); }}
            onClear={() => { setAddImage(null); setAddImagePreview(null); setAddImageUrl(null); }}
            label="Upload category image"
          />
          <button onClick={handleAdd} disabled={saving} className="w-full py-2.5 rounded-xl gradient-brand text-primary-foreground text-xs font-bold disabled:opacity-60 flex items-center justify-center gap-1.5">
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} Add Category
          </button>
        </div>
      </Modal>

      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Repair Category">
        <div className="space-y-3">
          <input placeholder="Category name" value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <ImageUpload
            preview={editImagePreview || editImageUrl}
            onFileSelect={(f) => { setEditImage(f); setEditImagePreview(URL.createObjectURL(f)); setEditImageUrl(null); }}
            onUrlSet={(url) => { setEditImageUrl(url); setEditImagePreview(null); setEditImage(null); }}
            onClear={() => { setEditImage(null); setEditImagePreview(null); setEditImageUrl(null); }}
            label="Change image"
          />
          <button onClick={handleEdit} disabled={editSaving} className="w-full py-2.5 rounded-xl gradient-brand text-primary-foreground text-xs font-bold disabled:opacity-60 flex items-center justify-center gap-1.5">
            {editSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />} Save Changes
          </button>
        </div>
      </Modal>

      <Modal open={!!moveItem} onClose={() => { setMoveItem(null); setMovePosition(""); }} title="Move Repair Category">
        <div className="space-y-3">
          <p className="text-xs leading-5 text-muted-foreground">
            {moveItem ? `Move ${moveItem.name} to a new position in the category list.` : ""}
          </p>
          <input
            type="number"
            min="1"
            max={categories.length}
            value={movePosition}
            onChange={(e) => setMovePosition(e.target.value)}
            className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button onClick={handleMove} disabled={moveSaving} className="w-full py-2.5 rounded-xl gradient-brand text-primary-foreground text-xs font-bold disabled:opacity-60 flex items-center justify-center gap-1.5">
            {moveSaving ? <Loader2 className="size-3.5 animate-spin" /> : <GripVertical className="size-3.5" />} Move Category
          </button>
        </div>
      </Modal>

      {loading ? <div className="flex justify-center py-12"><Loader2 className="size-5 animate-spin text-primary" /></div> : categories.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground"><Grid3X3 className="size-8 mx-auto mb-2 opacity-30" /><p className="text-sm font-semibold">No categories yet</p></div>
      ) : (
        <div className="space-y-2">
          {sortByPositionThenName(categories).map((c, index) => (
            <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
              {c.image_url ? <img src={c.image_url} alt={c.name} className="size-8 rounded-lg object-contain flex-shrink-0" /> : <div className="size-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0"><Grid3X3 className="size-4 text-muted-foreground" /></div>}
              <span className="flex-1 text-sm font-semibold text-foreground truncate">{c.name}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => openMove(c, index)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary" title="Move category">
                  <GripVertical className="size-3.5" />
                </button>
                <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"><Pencil className="size-3.5" /></button>
                <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"><Trash2 className="size-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Assign Repair Services Tab ─────────────────────────────
const AssignRepairTab = ({ serviceType }: { serviceType: string }) => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedSeries, setSelectedSeries] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [categories, setCategories] = useState<RepairCategory[]>([]);
  const [assigned, setAssigned] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedCat, setSelectedCat] = useState("");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);

  const brandServiceType = serviceType === "laptop" ? "laptop" : "mobile";

  useEffect(() => { dataClient.from("brands").select("*").eq("service_type", brandServiceType).order("name").then(({ data }) => { if (data) setBrands(data as Brand[]); }); }, [brandServiceType]);
  useEffect(() => {
    fetchRepairCategoriesForAdmin(serviceType).then(({ data }: any) => {
      if (data) setCategories(sortByPositionThenName(data));
    });
  }, [serviceType]);
  useEffect(() => { if (selectedBrand) { dataClient.from("series").select("*").eq("brand_id", selectedBrand).order("name").then(({ data }) => { if (data) setSeriesList(data as any); }); } else setSeriesList([]); setSelectedSeries(""); }, [selectedBrand]);
  useEffect(() => { if (selectedSeries) { dataClient.from("models").select("*").eq("series_id", selectedSeries).order("name").then(({ data }) => { if (data) setModels(data as any); }); } else setModels([]); setSelectedModel(""); }, [selectedSeries]);

  const fetchAssigned = async (modelId: string) => {
    setLoading(true);
    const { data } = await (dataClient.from("model_repair_services") as any).select("*, repair_categories(name)").eq("model_id", modelId);
    if (data) setAssigned(data);
    setLoading(false);
  };

  useEffect(() => { if (selectedModel) fetchAssigned(selectedModel); else setAssigned([]); }, [selectedModel]);

  const handleAssign = async () => {
    if (!selectedModel || !selectedCat || !price) return;
    setSaving(true);
    const { error } = await (dataClient.from("model_repair_services") as any).insert({
      model_id: selectedModel, repair_category_id: selectedCat, price: parseFloat(price),
    });
    if (error) toast.error(error.message); else { toast.success("Repair service assigned"); setShowAdd(false); setSelectedCat(""); setPrice(""); fetchAssigned(selectedModel); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await (dataClient.from("model_repair_services" as any) as any).delete().eq("id", id);
    fetchAssigned(selectedModel); toast.success("Deleted");
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div>
          <label htmlFor="field-servicestab-1893" className="text-[10px] font-semibold text-muted-foreground mb-1 block">Brand</label>
          <div className="relative">
            <select id="field-servicestab-1893" value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} className="w-full text-xs border border-border rounded-xl p-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none">
              <option value="">Choose&hellip;</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
          </div>
        </div>
        <div>
          <label htmlFor="field-servicestab-1903" className="text-[10px] font-semibold text-muted-foreground mb-1 block">Series</label>
          <div className="relative">
            <select id="field-servicestab-1903" value={selectedSeries} onChange={(e) => setSelectedSeries(e.target.value)} disabled={!selectedBrand} className="w-full text-xs border border-border rounded-xl p-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none disabled:opacity-50">
              <option value="">Choose&hellip;</option>
              {seriesList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
          </div>
        </div>
        <div>
          <label htmlFor="field-servicestab-1913" className="text-[10px] font-semibold text-muted-foreground mb-1 block">Model</label>
          <div className="relative">
            <select id="field-servicestab-1913" value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} disabled={!selectedSeries} className="w-full text-xs border border-border rounded-xl p-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none disabled:opacity-50">
              <option value="">Choose&hellip;</option>
              {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      {selectedModel && <button onClick={() => setShowAdd(true)} className="mb-4 flex items-center gap-1.5 text-xs font-bold text-primary"><Plus className="size-3.5" /> Assign Repair</button>}

      <Modal open={showAdd} onClose={() => { setShowAdd(false); setSelectedCat(""); setPrice(""); }} title="Assign Repair Service">
        <div className="space-y-3">
          <div>
            <label htmlFor="field-servicestab-1929" className="text-xs font-semibold text-muted-foreground mb-1 block">Repair Category</label>
            <div className="relative">
              <select id="field-servicestab-1929" value={selectedCat} onChange={(e) => setSelectedCat(e.target.value)} className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none">
                <option value="">Choose&hellip;</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          <div>
            <label htmlFor="field-servicestab-1939" className="text-xs font-semibold text-muted-foreground mb-1 block">Price (₹)</label>
            <input id="field-servicestab-1939" type="number" placeholder="499" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <button onClick={handleAssign} disabled={saving || !selectedCat || !price} className="w-full py-2.5 rounded-xl gradient-brand text-primary-foreground text-xs font-bold disabled:opacity-60 flex items-center justify-center gap-1.5">
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} Assign
          </button>
        </div>
      </Modal>

      {!selectedModel ? <p className="text-xs text-muted-foreground text-center py-8">Select brand, series & model</p> : loading ? <div className="flex justify-center py-12"><Loader2 className="size-5 animate-spin text-primary" /></div> : assigned.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground"><Tag className="size-8 mx-auto mb-2 opacity-30" /><p className="text-sm font-semibold">No repairs assigned</p></div>
      ) : (
        <div className="space-y-2">
          {assigned.map((a: any) => (
            <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
              <div className="flex-1"><span className="text-sm font-bold text-foreground">{a.repair_categories?.name || "Unknown"}</span><span className="ml-2 text-sm font-extrabold text-primary">₹{a.price}</span></div>
              <button onClick={() => handleDelete(a.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"><Trash2 className="size-3.5" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Repair Subcategories Tab ─────────────────────────────
type RepairSubcategory = { id: string; category_id: string; name: string; image_url: string | null; price: number; sort_order?: number | null };

const RepairSubcategoriesTab = ({ serviceType }: { serviceType: string }) => {
  const [categories, setCategories] = useState<RepairCategory[]>([]);
  const [selectedCat, setSelectedCat] = useState("");
  const [subs, setSubs] = useState<RepairSubcategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [addImage, setAddImage] = useState<File | null>(null);
  const [addImagePreview, setAddImagePreview] = useState<string | null>(null);
  const [addImageUrl, setAddImageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editItem, setEditItem] = useState<RepairSubcategory | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editImageUrl, setEditImageUrl] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [moveItem, setMoveItem] = useState<RepairSubcategory | null>(null);
  const [movePosition, setMovePosition] = useState("");
  const [moveSaving, setMoveSaving] = useState(false);

  useEffect(() => {
    fetchRepairCategoriesForAdmin(serviceType).then(({ data }: any) => {
      if (data) setCategories(sortByPositionThenName(data));
    });
  }, [serviceType]);

  const fetchSubs = async (catId: string) => {
    setLoading(true);
    const { data, error } = await fetchRepairSubcategoriesForAdmin(catId);
    if (data) setSubs(sortByPositionThenName(data as RepairSubcategory[]));
    if (error) toast.error(error.message);
    setLoading(false);
  };

  useEffect(() => { if (selectedCat) fetchSubs(selectedCat); else setSubs([]); }, [selectedCat]);

  const handleAdd = async () => {
    if (!name.trim() || !selectedCat) return;
    setSaving(true);
    const insertData: any = { name: name.trim(), category_id: selectedCat, price: parseFloat(price) || 0, sort_order: subs.length + 1 };
    if (addImageUrl) insertData.image_url = addImageUrl;
    const { data, error } = await insertRepairCatalogRow("repair_subcategories", insertData);
    if (!error && data && addImage) {
      const url = await uploadServiceImage("service-images", `subsvc-${data.id}`, addImage);
      if (url) await (dataClient.from("repair_subcategories") as any).update({ image_url: url }).eq("id", data.id);
    }
    if (error) toast.error(error.message); else { toast.success("Subcategory added"); setShowAdd(false); setName(""); setPrice(""); setAddImage(null); setAddImagePreview(null); setAddImageUrl(null); fetchSubs(selectedCat); }
    setSaving(false);
  };

  const openEdit = (s: RepairSubcategory) => {
    setEditItem(s); setEditName(s.name); setEditPrice(String(s.price)); setEditImagePreview(s.image_url); setEditImage(null); setEditImageUrl(null);
  };

  const handleEdit = async () => {
    if (!editItem || !editName.trim()) return;
    setEditSaving(true);
    const updates: any = { name: editName.trim(), price: parseFloat(editPrice) || 0 };
    if (editImageUrl) updates.image_url = editImageUrl;
    else if (editImage) {
      const url = await uploadServiceImage("service-images", `subsvc-${editItem.id}`, editImage);
      if (url) updates.image_url = url;
    }
    await (dataClient.from("repair_subcategories") as any).update(updates).eq("id", editItem.id);
    toast.success("Updated"); setEditItem(null); fetchSubs(selectedCat);
    setEditSaving(false);
  };

  const handleDelete = async (id: string) => {
    await (dataClient.from("repair_subcategories") as any).delete().eq("id", id);
    fetchSubs(selectedCat); toast.success("Deleted");
  };

  const openMove = (subcategory: RepairSubcategory, currentIndex: number) => {
    setMoveItem(subcategory);
    setMovePosition(String(currentIndex + 1));
  };

  const handleMove = async () => {
    if (!moveItem || subs.length === 0) return;

    const parsedPosition = Number.parseInt(movePosition, 10);
    if (Number.isNaN(parsedPosition)) {
      toast.error("Enter a valid position");
      return;
    }

    const currentItems = sortByPositionThenName(subs);
    const targetIndex = Math.min(Math.max(parsedPosition, 1), currentItems.length) - 1;
    const currentIndex = currentItems.findIndex((subcategory) => subcategory.id === moveItem.id);

    if (currentIndex === -1) {
      toast.error("Subcategory not found");
      return;
    }

    if (currentIndex === targetIndex) {
      setMoveItem(null);
      setMovePosition("");
      return;
    }

    const nextItems = [...currentItems];
    const [movedSubcategory] = nextItems.splice(currentIndex, 1);
    nextItems.splice(targetIndex, 0, movedSubcategory);

    setMoveSaving(true);
    const updates = await Promise.all(nextItems.map((subcategory, index) =>
      (dataClient.from("repair_subcategories") as any).update({ sort_order: index + 1 }).eq("id", subcategory.id),
    ));
    const failed = updates.find((result: any) => result.error);

    if (failed) {
      toast.error(failed.error.message || "Unable to move subcategory");
    } else {
      await revalidateCatalogMutation(serviceType, { extraTags: ["catalog-repairs"] });
      setSubs(nextItems.map((subcategory, index) => ({ ...subcategory, sort_order: index + 1 })));
      toast.success("Subcategory position updated");
      setMoveItem(null);
      setMovePosition("");
    }
    setMoveSaving(false);
  };

  return (
    <div>
      <div className="mb-4">
        <label htmlFor="field-servicestab-2097" className="text-[10px] font-semibold text-muted-foreground mb-1 block">Select Category</label>
        <div className="relative">
          <select id="field-servicestab-2097" value={selectedCat} onChange={(e) => setSelectedCat(e.target.value)} className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none">
            <option value="">Choose category&hellip;</option>
            {sortByPositionThenName(categories).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {selectedCat && <button onClick={() => setShowAdd(true)} className="mb-4 flex items-center gap-1.5 text-xs font-bold text-primary"><Plus className="size-3.5" /> Add Subcategory</button>}

      <Modal open={showAdd} onClose={() => { setShowAdd(false); setName(""); setPrice(""); setAddImage(null); setAddImagePreview(null); setAddImageUrl(null); }} title="Add Subcategory">
        <div className="space-y-3">
          <input placeholder="e.g. Original Screen" value={name} onChange={(e) => setName(e.target.value)} autoFocus className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <input type="number" placeholder="Price (₹)" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <ImageUpload
            preview={addImagePreview || addImageUrl}
            onFileSelect={(f) => { setAddImage(f); setAddImagePreview(URL.createObjectURL(f)); setAddImageUrl(null); }}
            onUrlSet={(url) => { setAddImageUrl(url); setAddImagePreview(null); setAddImage(null); }}
            onClear={() => { setAddImage(null); setAddImagePreview(null); setAddImageUrl(null); }}
            label="Upload image"
          />
          <button onClick={handleAdd} disabled={saving} className="w-full py-2.5 rounded-xl gradient-brand text-primary-foreground text-xs font-bold disabled:opacity-60 flex items-center justify-center gap-1.5">
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} Add
          </button>
        </div>
      </Modal>

      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Subcategory">
        <div className="space-y-3">
          <input placeholder="Name" value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <input type="number" placeholder="Price (₹)" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <ImageUpload
            preview={editImagePreview || editImageUrl}
            onFileSelect={(f) => { setEditImage(f); setEditImagePreview(URL.createObjectURL(f)); setEditImageUrl(null); }}
            onUrlSet={(url) => { setEditImageUrl(url); setEditImagePreview(null); setEditImage(null); }}
            onClear={() => { setEditImage(null); setEditImagePreview(null); setEditImageUrl(null); }}
            label="Change image"
          />
          <button onClick={handleEdit} disabled={editSaving} className="w-full py-2.5 rounded-xl gradient-brand text-primary-foreground text-xs font-bold disabled:opacity-60 flex items-center justify-center gap-1.5">
            {editSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />} Save
          </button>
        </div>
      </Modal>

      <Modal open={!!moveItem} onClose={() => { setMoveItem(null); setMovePosition(""); }} title="Move Subcategory">
        <div className="space-y-3">
          <p className="text-xs leading-5 text-muted-foreground">
            {moveItem ? `Move ${moveItem.name} to a new position in this subcategory list.` : ""}
          </p>
          <input
            type="number"
            min="1"
            max={subs.length}
            value={movePosition}
            onChange={(e) => setMovePosition(e.target.value)}
            className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button onClick={handleMove} disabled={moveSaving} className="w-full py-2.5 rounded-xl gradient-brand text-primary-foreground text-xs font-bold disabled:opacity-60 flex items-center justify-center gap-1.5">
            {moveSaving ? <Loader2 className="size-3.5 animate-spin" /> : <GripVertical className="size-3.5" />} Move Subcategory
          </button>
        </div>
      </Modal>

      {!selectedCat ? <p className="text-xs text-muted-foreground text-center py-8">Select a category first</p> : loading ? <div className="flex justify-center py-12"><Loader2 className="size-5 animate-spin text-primary" /></div> : subs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground"><ListTree className="size-8 mx-auto mb-2 opacity-30" /><p className="text-sm font-semibold">No subcategories yet</p></div>
      ) : (
        <div className="space-y-2">
          {sortByPositionThenName(subs).map((s, index) => (
            <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
              {s.image_url ? <img src={s.image_url} alt={s.name} className="size-8 rounded-lg object-contain flex-shrink-0" /> : <div className="size-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0"><ListTree className="size-4 text-muted-foreground" /></div>}
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-foreground truncate block">{s.name}</span>
                <span className="text-xs font-bold text-primary">₹{s.price}</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => openMove(s, index)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary" title="Move subcategory">
                  <GripVertical className="size-3.5" />
                </button>
                <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"><Pencil className="size-3.5" /></button>
                <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"><Trash2 className="size-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Model Repair Pricing Tab ─────────────────────────────
type ModelRepairSubcategoryPrice = { id: string; model_id: string; repair_subcategory_id: string; price: number };

export const RepairPricingMatrixTab = ({ serviceType }: { serviceType: CatalogServiceType }) => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedSeries, setSelectedSeries] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [categories, setCategories] = useState<RepairCategory[]>([]);
  const [selectedCat, setSelectedCat] = useState("");
  const [subs, setSubs] = useState<RepairSubcategory[]>([]);
  const [prices, setPrices] = useState<ModelRepairSubcategoryPrice[]>([]);
  const [draftPrices, setDraftPrices] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [setupError, setSetupError] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState("");
  const [priceDisplayEnabled, setPriceDisplayEnabled] = useState(true);
  const [settingLoading, setSettingLoading] = useState(true);
  const [settingSaving, setSettingSaving] = useState(false);
  const copy = serviceCopy[serviceType];

  useEffect(() => { dataClient.from("brands").select("*").eq("service_type", serviceType).order("name").then(({ data }) => { if (data) setBrands(data as Brand[]); }); }, [serviceType]);
  useEffect(() => {
    fetchRepairCategoriesForAdmin(serviceType).then(({ data }: any) => {
      if (data) setCategories(sortByPositionThenName(data));
    });
  }, [serviceType]);
  useEffect(() => { if (selectedBrand) { dataClient.from("series").select("*").eq("brand_id", selectedBrand).order("name").then(({ data }) => { if (data) setSeriesList(data as any); }); } else setSeriesList([]); setSelectedSeries(""); }, [selectedBrand]);
  useEffect(() => { if (selectedSeries) { dataClient.from("models").select("*").eq("series_id", selectedSeries).order("name").then(({ data }) => { if (data) setModels(data as any); }); } else setModels([]); setSelectedModel(""); }, [selectedSeries]);

  useEffect(() => {
    let ignore = false;

    async function fetchPriceDisplaySetting() {
      setSettingLoading(true);
      const { data, error } = await (dataClient.from("app_settings") as any)
        .select("value")
        .eq("key", "repair_subcategory_prices")
        .maybeSingle();

      if (!ignore) {
        if (!error && data?.value && typeof data.value === "object" && !Array.isArray(data.value)) {
          setPriceDisplayEnabled(data.value.visible !== false);
        } else {
          setPriceDisplayEnabled(true);
        }
        setSettingLoading(false);
      }
    }

    fetchPriceDisplaySetting();

    return () => {
      ignore = true;
    };
  }, []);

  const selectedBrandName = brands.find((brand) => brand.id === selectedBrand)?.name;
  const selectedModelName = models.find((model) => model.id === selectedModel)?.name;
  const priceMap = new Map(prices.map((item) => [item.repair_subcategory_id, item]));
  const filteredSubs = subs.filter((subcategory) => subcategory.name.toLowerCase().includes(search.trim().toLowerCase()));
  const customPriceCount = subs.filter((subcategory) => priceMap.has(subcategory.id)).length;

  const fetchPricing = async (catId: string, modelId: string) => {
    setLoading(true);
    const [subcategoryResult, priceResult] = await Promise.all([
      fetchRepairSubcategoriesForAdmin(catId),
      (dataClient.from("model_repair_subcategory_prices") as any)
        .select("id, model_id, repair_subcategory_id, price")
        .eq("model_id", modelId),
    ]);
    const nextSubs = (subcategoryResult.data || []) as RepairSubcategory[];
    const missingPricingTable = Boolean(priceResult.error?.message && (priceResult.error.message.includes("model_repair_subcategory_prices") || priceResult.error.message.includes("schema cache")));
    const nextPrices = missingPricingTable ? [] : ((priceResult.data || []) as ModelRepairSubcategoryPrice[]);
    const nextPriceMap = new Map(nextPrices.map((item) => [item.repair_subcategory_id, item]));

    setSetupError(missingPricingTable ? "Apply the model repair pricing database migration, then refresh the schema cache." : "");
    setSubs(nextSubs);
    setPrices(nextPrices);
    setDraftPrices(
      nextSubs.reduce<Record<string, string>>((acc, subcategory) => {
        acc[subcategory.id] = String(nextPriceMap.get(subcategory.id)?.price ?? subcategory.price ?? "");
        return acc;
      }, {}),
    );
    setLoading(false);
  };

  useEffect(() => {
    if (selectedCat && selectedModel) {
      fetchPricing(selectedCat, selectedModel);
    } else {
      setSubs([]);
      setPrices([]);
      setDraftPrices({});
    }
  }, [selectedCat, selectedModel]);

  const savePrice = async (subcategory: RepairSubcategory) => {
    if (!selectedModel) return;
    if (setupError) {
      toast.error(setupError);
      return;
    }

    const nextPrice = Number(draftPrices[subcategory.id] || 0);
    if (Number.isNaN(nextPrice) || nextPrice < 0) {
      toast.error("Enter a valid price");
      return;
    }

    setSavingId(subcategory.id);
    const { error } = await (dataClient.from("model_repair_subcategory_prices") as any).upsert(
      { model_id: selectedModel, repair_subcategory_id: subcategory.id, price: nextPrice },
      { onConflict: "model_id,repair_subcategory_id" },
    );

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Model price saved");
      await revalidateCatalogMutation(serviceType, { extraTags: ["catalog-repairs"] });
      await fetchPricing(selectedCat, selectedModel);
    }
    setSavingId("");
  };

  const clearPrice = async (subcategoryId: string) => {
    const existing = priceMap.get(subcategoryId);
    if (!existing || !selectedModel) return;
    if (setupError) {
      toast.error(setupError);
      return;
    }

    setSavingId(subcategoryId);
    const { error } = await (dataClient.from("model_repair_subcategory_prices" as any) as any).delete().eq("id", existing.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Using global price now");
      await revalidateCatalogMutation(serviceType, { extraTags: ["catalog-repairs"] });
      await fetchPricing(selectedCat, selectedModel);
    }
    setSavingId("");
  };

  const applyGlobalPrices = () => {
    setDraftPrices(
      subs.reduce<Record<string, string>>((acc, subcategory) => {
        acc[subcategory.id] = String(subcategory.price ?? 0);
        return acc;
      }, {}),
    );
  };

  const toggleGlobalPriceDisplay = async () => {
    const nextEnabled = !priceDisplayEnabled;

    setSettingSaving(true);
    const { error } = await (dataClient.from("app_settings") as any).upsert(
      { key: "repair_subcategory_prices", value: { visible: nextEnabled } },
      { onConflict: "key" },
    );

    if (error) {
      toast.error(error.message);
    } else {
      setPriceDisplayEnabled(nextEnabled);
      toast.success(nextEnabled ? "Sub-repair prices enabled for customers" : "Sub-repair prices hidden from customers");
      await Promise.all([
        revalidateCatalogMutation("mobile", { extraTags: ["catalog-repairs"] }),
        revalidateCatalogMutation("laptop", { extraTags: ["catalog-repairs"] }),
      ]);
    }
    setSettingSaving(false);
  };

  return (
    <div>
      <div className="mb-4 rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">{copy.label} model pricing</h3>
            <p className="text-xs text-muted-foreground">Pick a model and save exact subcategory prices. The global display switch controls whether customers see all sub-repair prices.</p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <button
              onClick={toggleGlobalPriceDisplay}
              disabled={settingLoading || settingSaving}
              className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-xs font-black transition-colors disabled:opacity-60 ${
                priceDisplayEnabled
                  ? "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15"
                  : "bg-destructive/10 text-destructive hover:bg-destructive/15"
              }`}
            >
              {settingSaving ? "Saving..." : priceDisplayEnabled ? "Pricing Enabled" : "Pricing Disabled"}
            </button>
            <div className="text-xs font-bold text-primary">{customPriceCount}/{subs.length} custom prices</div>
          </div>
        </div>
      </div>

      <div className="grid gap-2 mb-4 sm:grid-cols-4">
        <div>
          <label htmlFor="field-servicestab-2331" className="text-[10px] font-semibold text-muted-foreground mb-1 block">Brand</label>
          <div className="relative">
            <select id="field-servicestab-2331" value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} className="w-full text-xs border border-border rounded-xl p-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none">
              <option value="">Choose&hellip;</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
          </div>
        </div>
        <div>
          <label htmlFor="field-servicestab-2341" className="text-[10px] font-semibold text-muted-foreground mb-1 block">Series</label>
          <div className="relative">
            <select id="field-servicestab-2341" value={selectedSeries} onChange={(e) => setSelectedSeries(e.target.value)} disabled={!selectedBrand} className="w-full text-xs border border-border rounded-xl p-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none disabled:opacity-50">
              <option value="">Choose&hellip;</option>
              {seriesList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
          </div>
        </div>
        <div>
          <label htmlFor="field-servicestab-2351" className="text-[10px] font-semibold text-muted-foreground mb-1 block">Model</label>
          <div className="relative">
            <select id="field-servicestab-2351" value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} disabled={!selectedSeries} className="w-full text-xs border border-border rounded-xl p-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none disabled:opacity-50">
              <option value="">Choose&hellip;</option>
              {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
          </div>
        </div>
        <div>
          <label htmlFor="field-servicestab-2361" className="text-[10px] font-semibold text-muted-foreground mb-1 block">Category</label>
          <div className="relative">
            <select id="field-servicestab-2361" value={selectedCat} onChange={(e) => setSelectedCat(e.target.value)} disabled={!selectedModel} className="w-full text-xs border border-border rounded-xl p-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none disabled:opacity-50">
              <option value="">Choose&hellip;</option>
              {sortByPositionThenName(categories).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      {selectedModel && selectedCat ? (
        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search subcategory..." className="min-w-0 flex-1 text-sm border border-border rounded-xl px-3 py-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <button onClick={applyGlobalPrices} className="rounded-xl border border-border px-3 py-2 text-xs font-bold text-foreground hover:bg-secondary">Use global prices</button>
        </div>
      ) : null}

      {setupError ? (
        <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-xs font-semibold text-destructive">
          {setupError}
        </div>
      ) : null}

      {!selectedModel ? <p className="text-xs text-muted-foreground text-center py-8">Select brand, series & model</p> : !selectedCat ? <p className="text-xs text-muted-foreground text-center py-8">Select a repair category to edit prices</p> : loading ? <div className="flex justify-center py-12"><Loader2 className="size-5 animate-spin text-primary" /></div> : filteredSubs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground"><ListTree className="size-8 mx-auto mb-2 opacity-30" /><p className="text-sm font-semibold">No matching subcategories</p></div>
      ) : (
        <div className="space-y-2">
          {filteredSubs.map((subcategory) => {
            const customPrice = priceMap.get(subcategory.id);
            const isSaving = savingId === subcategory.id;

            return (
              <div key={subcategory.id} className="grid gap-3 rounded-xl border border-border bg-card p-3 sm:grid-cols-[1fr_110px_160px_140px] sm:items-center">
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-foreground">{subcategory.name}</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">{[selectedBrandName, selectedModelName].filter(Boolean).join(" ")}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase text-muted-foreground">Global</div>
                  <div className="text-sm font-extrabold text-muted-foreground">Rs. {subcategory.price}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase text-muted-foreground">Model price</div>
                  <input type="number" min="0" value={draftPrices[subcategory.id] ?? ""} onChange={(e) => setDraftPrices((current) => ({ ...current, [subcategory.id]: e.target.value }))} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div className="flex items-center gap-2 sm:justify-end">
                  {customPrice ? <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">Custom</span> : <span className="rounded-full bg-secondary px-2 py-1 text-[10px] font-bold text-muted-foreground">Global</span>}
                  <button onClick={() => savePrice(subcategory)} disabled={isSaving} className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground disabled:opacity-60">{isSaving ? "Saving" : "Save"}</button>
                  {customPrice ? <button onClick={() => clearPrice(subcategory.id)} disabled={isSaving} className="rounded-lg border border-border px-3 py-2 text-xs font-bold text-muted-foreground hover:text-destructive disabled:opacity-60">Clear</button> : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const DeviceGuardServicesTab = () => {
  const [activeTab, setActiveTab] = useState("brands");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
      <TabsList className={`${adminSubtabListClass} md:grid-cols-5`}>
        <TabsTrigger value="brands" className={adminSubtabTriggerClass}><Tag className="size-3" />Brands</TabsTrigger>
        <TabsTrigger value="series" className={adminSubtabTriggerClass}><Layers className="size-3" />Series</TabsTrigger>
        <TabsTrigger value="models" className={adminSubtabTriggerClass}><Smartphone className="size-3" />Models</TabsTrigger>
        <TabsTrigger value="guards" className={adminSubtabTriggerClass}><Grid3X3 className="size-3" />Guards</TabsTrigger>
        <TabsTrigger value="assign" className={adminSubtabTriggerClass}><Shield className="size-3" />Assign</TabsTrigger>
      </TabsList>
      <TabsContent value="brands">{activeTab === "brands" ? <BrandsTab serviceType="mobile" /> : null}</TabsContent>
      <TabsContent value="series">{activeTab === "series" ? <SeriesTab serviceType="mobile" /> : null}</TabsContent>
      <TabsContent value="models">{activeTab === "models" ? <ModelsTab serviceType="mobile" /> : null}</TabsContent>
      <TabsContent value="guards">{activeTab === "guards" ? <DeviceGuardsManageTab /> : null}</TabsContent>
      <TabsContent value="assign">{activeTab === "assign" ? <ModelGuardsTab /> : null}</TabsContent>
    </Tabs>
  );
};

// ─── Mobile Repair Services Tab ─────────────────────────────
export const MobileRepairServicesTab = () => {
  const [activeTab, setActiveTab] = useState("brands");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
      <TabsList className={`${adminSubtabListClass} md:grid-cols-6`}>
        <TabsTrigger value="brands" className={adminSubtabTriggerClass}><Tag className="size-3" />Brands</TabsTrigger>
        <TabsTrigger value="series" className={adminSubtabTriggerClass}><Layers className="size-3" />Series</TabsTrigger>
        <TabsTrigger value="models" className={adminSubtabTriggerClass}><Smartphone className="size-3" />Models</TabsTrigger>
        <TabsTrigger value="repairs" className={adminSubtabTriggerClass}><Grid3X3 className="size-3" /><span className="hidden sm:inline">Categories</span><span className="sm:hidden">Cats</span></TabsTrigger>
        <TabsTrigger value="subcategories" className={adminSubtabTriggerClass}><ListTree className="size-3" /><span className="hidden sm:inline">Subcategories</span><span className="sm:hidden">Subcats</span></TabsTrigger>
        <TabsTrigger value="pricing" className={adminSubtabTriggerClass}><Tag className="size-3" />Pricing</TabsTrigger>
      </TabsList>
      <TabsContent value="brands">{activeTab === "brands" ? <BrandsTab serviceType="mobile" /> : null}</TabsContent>
      <TabsContent value="series">{activeTab === "series" ? <SeriesTab serviceType="mobile" /> : null}</TabsContent>
      <TabsContent value="models">{activeTab === "models" ? <ModelsTab serviceType="mobile" /> : null}</TabsContent>
      <TabsContent value="repairs">{activeTab === "repairs" ? <RepairCategoriesTab serviceType="mobile" /> : null}</TabsContent>
      <TabsContent value="subcategories">{activeTab === "subcategories" ? <RepairSubcategoriesTab serviceType="mobile" /> : null}</TabsContent>
      <TabsContent value="pricing">{activeTab === "pricing" ? <RepairPricingMatrixTab serviceType="mobile" /> : null}</TabsContent>
    </Tabs>
  );
};

// ─── Laptop Repair Services Tab ─────────────────────────────
export const LaptopRepairServicesTab = () => {
  const [activeTab, setActiveTab] = useState("brands");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
      <TabsList className={`${adminSubtabListClass} md:grid-cols-6`}>
        <TabsTrigger value="brands" className={adminSubtabTriggerClass}><Tag className="size-3" />Brands</TabsTrigger>
        <TabsTrigger value="series" className={adminSubtabTriggerClass}><Layers className="size-3" />Series</TabsTrigger>
        <TabsTrigger value="models" className={adminSubtabTriggerClass}><Smartphone className="size-3" />Models</TabsTrigger>
        <TabsTrigger value="repairs" className={adminSubtabTriggerClass}><Grid3X3 className="size-3" /><span className="hidden sm:inline">Categories</span><span className="sm:hidden">Cats</span></TabsTrigger>
        <TabsTrigger value="subcategories" className={adminSubtabTriggerClass}><ListTree className="size-3" /><span className="hidden sm:inline">Subcategories</span><span className="sm:hidden">Subcats</span></TabsTrigger>
        <TabsTrigger value="pricing" className={adminSubtabTriggerClass}><Tag className="size-3" />Pricing</TabsTrigger>
      </TabsList>
      <TabsContent value="brands">{activeTab === "brands" ? <BrandsTab serviceType="laptop" /> : null}</TabsContent>
      <TabsContent value="series">{activeTab === "series" ? <SeriesTab serviceType="laptop" /> : null}</TabsContent>
      <TabsContent value="models">{activeTab === "models" ? <ModelsTab serviceType="laptop" /> : null}</TabsContent>
      <TabsContent value="repairs">{activeTab === "repairs" ? <RepairCategoriesTab serviceType="laptop" /> : null}</TabsContent>
      <TabsContent value="subcategories">{activeTab === "subcategories" ? <RepairSubcategoriesTab serviceType="laptop" /> : null}</TabsContent>
      <TabsContent value="pricing">{activeTab === "pricing" ? <RepairPricingMatrixTab serviceType="laptop" /> : null}</TabsContent>
    </Tabs>
  );
};

const ServicesTab = () => <MobileRepairServicesTab />;
export default ServicesTab;
