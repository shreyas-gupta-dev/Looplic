"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/src/lib/data-client/client";
import { toast } from "sonner";
import {
  Plus, Trash2, Pencil, Loader2, X, Search, Package, Filter,
} from "lucide-react";
import ImageUpload from "./ImageUpload";

const dataClient = new Proxy({} as any, {
  get(_target, property) {
    return (createClient() as any)[property];
  },
});

type Product = {
  id: string;
  name: string;
  slug: string;
  brand_id: string | null;
  model_id: string | null;
  category: string;
  condition: string;
  price: number;
  original_price: number | null;
  storage: string | null;
  ram: string | null;
  color: string | null;
  description: string | null;
  warranty_months: number | null;
  stock: number;
  featured: boolean;
  active: boolean;
  cover_image: string | null;
  created_at: string;
};

type Brand = { id: string; name: string };
type Model = { id: string; name: string; series_id: string };

const CATEGORIES = ["smartphone", "laptop", "tablet", "smartwatch", "audio", "accessory"];
const CONDITIONS = ["superb", "good", "fair", "needs_repair"];

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary";
const selectClass = inputClass + " appearance-none";
const primaryBtn =
  "inline-flex items-center gap-1.5 rounded-xl bg-[#48C479] px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50";
const ghostBtn =
  "inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-xs font-bold text-foreground hover:bg-secondary";
const dangerBtn =
  "inline-flex items-center gap-1.5 rounded-xl bg-red-500 px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50";

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ─── Modal ──────────────────────────────────────────────────────────────────
const Modal = ({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-card w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl border border-border shadow-xl max-h-[85vh] overflow-y-auto"
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

// ─── Delete Confirmation ────────────────────────────────────────────────────
function DeleteConfirmDialog({ open, onClose, onConfirm, productName, deleting }: {
  open: boolean; onClose: () => void; onConfirm: () => void; productName: string; deleting: boolean;
}) {
  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title="Delete Product">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete <strong className="text-foreground">{productName}</strong>? This action cannot be undone.
        </p>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className={ghostBtn} disabled={deleting}>Cancel</button>
          <button onClick={onConfirm} className={dangerBtn} disabled={deleting}>
            {deleting ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Product Form Dialog ────────────────────────────────────────────────────
function ProductFormDialog({ open, onClose, product, brands, models, onSave, saving }: {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  brands: Brand[];
  models: Model[];
  onSave: (data: Partial<Product>, imageFile: File | null) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    name: "",
    slug: "",
    brand_id: "",
    model_id: "",
    category: "smartphone",
    condition: "superb",
    price: 0,
    original_price: 0,
    storage: "",
    ram: "",
    color: "",
    description: "",
    warranty_months: 6,
    stock: 1,
    featured: false,
    active: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || "",
        slug: product.slug || "",
        brand_id: product.brand_id || "",
        model_id: product.model_id || "",
        category: product.category || "smartphone",
        condition: product.condition || "superb",
        price: product.price || 0,
        original_price: product.original_price || 0,
        storage: product.storage || "",
        ram: product.ram || "",
        color: product.color || "",
        description: product.description || "",
        warranty_months: product.warranty_months || 6,
        stock: product.stock || 0,
        featured: product.featured || false,
        active: product.active ?? true,
      });
      setImagePreview(product.cover_image || null);
    } else {
      setForm({
        name: "", slug: "", brand_id: "", model_id: "", category: "smartphone",
        condition: "superb", price: 0, original_price: 0, storage: "", ram: "",
        color: "", description: "", warranty_months: 6, stock: 1, featured: false, active: true,
      });
      setImagePreview(null);
    }
    setImageFile(null);
  }, [product, open]);

  const handleNameChange = (val: string) => {
    setForm((f) => ({ ...f, name: val, slug: product ? f.slug : slugify(val) }));
  };

  const handleSubmit = () => {
    if (!form.name.trim()) { toast.error("Product name is required"); return; }
    if (!form.slug.trim()) { toast.error("Slug is required"); return; }
    if (form.price <= 0) { toast.error("Price must be greater than 0"); return; }
    onSave({ ...form, price: Number(form.price), original_price: Number(form.original_price) || null, warranty_months: Number(form.warranty_months), stock: Number(form.stock) }, imageFile);
  };

  return (
    <Modal open={open} onClose={onClose} title={product ? "Edit Product" : "Add Product"}>
      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Name *</label>
          <input className={inputClass} value={form.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="iPhone 13 Pro Max" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Slug</label>
          <input className={inputClass} value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="iphone-13-pro-max" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Brand</label>
            <select className={selectClass} value={form.brand_id} onChange={(e) => setForm((f) => ({ ...f, brand_id: e.target.value }))}>
              <option value="">Select brand</option>
              {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Model</label>
            <select className={selectClass} value={form.model_id} onChange={(e) => setForm((f) => ({ ...f, model_id: e.target.value }))}>
              <option value="">Select model</option>
              {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Category *</label>
            <select className={selectClass} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Condition *</label>
            <select className={selectClass} value={form.condition} onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value }))}>
              {CONDITIONS.map((c) => <option key={c} value={c}>{c.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Price (₹) *</label>
            <input className={inputClass} type="number" min={0} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))} />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Original Price (₹)</label>
            <input className={inputClass} type="number" min={0} value={form.original_price} onChange={(e) => setForm((f) => ({ ...f, original_price: Number(e.target.value) }))} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Storage</label>
            <input className={inputClass} value={form.storage} onChange={(e) => setForm((f) => ({ ...f, storage: e.target.value }))} placeholder="128 GB" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">RAM</label>
            <input className={inputClass} value={form.ram} onChange={(e) => setForm((f) => ({ ...f, ram: e.target.value }))} placeholder="6 GB" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Color</label>
            <input className={inputClass} value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} placeholder="Black" />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Description</label>
          <textarea className={inputClass + " min-h-[60px] resize-y"} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Product description..." />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Warranty (months)</label>
            <input className={inputClass} type="number" min={0} value={form.warranty_months} onChange={(e) => setForm((f) => ({ ...f, warranty_months: Number(e.target.value) }))} />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Stock *</label>
            <input className={inputClass} type="number" min={0} value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: Number(e.target.value) }))} />
          </div>
          <div className="flex flex-col gap-2 pt-5">
            <label className="flex items-center gap-2 text-xs font-medium">
              <input type="checkbox" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} className="rounded" />
              Featured
            </label>
            <label className="flex items-center gap-2 text-xs font-medium">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} className="rounded" />
              Active
            </label>
          </div>
        </div>
        <ImageUpload
          preview={imagePreview}
          onFileSelect={(f) => { setImageFile(f); setImagePreview(URL.createObjectURL(f)); }}
          onUrlSet={(url) => { setImageFile(null); setImagePreview(url); }}
          onClear={() => { setImageFile(null); setImagePreview(null); }}
          label="Cover image"
        />
        <div className="flex gap-2 justify-end pt-2">
          <button onClick={onClose} className={ghostBtn} disabled={saving}>Cancel</button>
          <button onClick={handleSubmit} className={primaryBtn} disabled={saving}>
            {saving ? <Loader2 className="size-3 animate-spin" /> : null}
            {product ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Main ProductsTab Component ─────────────────────────────────────────────
export default function ProductsTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Filters
  const [filterCategory, setFilterCategory] = useState("");
  const [filterCondition, setFilterCondition] = useState("");
  const [filterActive, setFilterActive] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    let query = dataClient.from("products").select("*").order("created_at", { ascending: false });
    if (filterCategory) query = query.eq("category", filterCategory);
    if (filterCondition) query = query.eq("condition", filterCondition);
    if (filterActive === "true") query = query.eq("active", true);
    if (filterActive === "false") query = query.eq("active", false);
    const { data, error } = await query;
    if (error) { toast.error("Failed to load products"); }
    else { setProducts(data || []); }
    setLoading(false);
  }, [filterCategory, filterCondition, filterActive]);

  const fetchBrandsAndModels = useCallback(async () => {
    const [brandsRes, modelsRes] = await Promise.all([
      dataClient.from("brands").select("id,name").order("name", { ascending: true }),
      dataClient.from("models").select("id,name,series_id").order("name", { ascending: true }),
    ]);
    if (brandsRes.data) setBrands(brandsRes.data);
    if (modelsRes.data) setModels(modelsRes.data);
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { fetchBrandsAndModels(); }, [fetchBrandsAndModels]);

  const handleSave = async (data: Partial<Product>, imageFile: File | null) => {
    setSaving(true);
    let coverImage = editingProduct?.cover_image || null;

    if (imageFile) {
      const path = `products/${Date.now()}-${imageFile.name}`;
      const { error: uploadErr } = await dataClient.storage.from("product-images").upload(path, imageFile);
      if (uploadErr) { toast.error("Image upload failed"); setSaving(false); return; }
      const { data: urlData } = dataClient.storage.from("product-images").getPublicUrl(path);
      coverImage = urlData.publicUrl;
    }

    const payload = { ...data, cover_image: coverImage };

    if (editingProduct) {
      const { error } = await dataClient.from("products").update(payload).eq("id", editingProduct.id);
      if (error) { toast.error("Failed to update product: " + error.message); }
      else { toast.success("Product updated"); setFormOpen(false); setEditingProduct(null); fetchProducts(); }
    } else {
      const { error } = await dataClient.from("products").insert(payload);
      if (error) { toast.error("Failed to create product: " + error.message); }
      else { toast.success("Product created"); setFormOpen(false); fetchProducts(); }
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;
    setDeleting(true);
    const { error } = await dataClient.from("products").delete().eq("id", deletingProduct.id);
    if (error) { toast.error("Failed to delete product"); }
    else { toast.success("Product deleted"); setDeleteOpen(false); setDeletingProduct(null); fetchProducts(); }
    setDeleting(false);
  };

  const filtered = products.filter((p) => {
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="mt-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Package className="size-5 text-[#48C479]" />
          <h2 className="text-lg font-bold text-foreground">Products</h2>
          <span className="rounded-full bg-[#48C479]/10 px-2 py-0.5 text-xs font-bold text-[#48C479]">{filtered.length}</span>
        </div>
        <button onClick={() => { setEditingProduct(null); setFormOpen(true); }} className={primaryBtn}>
          <Plus className="size-3.5" /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3">
        <Filter className="size-4 text-muted-foreground" />
        <div className="relative flex-1 min-w-[140px]">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            className={inputClass + " !pl-8"}
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select className={selectClass + " w-auto min-w-[120px]"} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
        <select className={selectClass + " w-auto min-w-[110px]"} value={filterCondition} onChange={(e) => setFilterCondition(e.target.value)}>
          <option value="">All Conditions</option>
          {CONDITIONS.map((c) => <option key={c} value={c}>{c.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}</option>)}
        </select>
        <select className={selectClass + " w-auto min-w-[100px]"} value={filterActive} onChange={(e) => setFilterActive(e.target.value)}>
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-[#48C479]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Package className="size-10 text-muted-foreground/40 mb-2" />
          <p className="text-sm font-medium text-muted-foreground">No products found</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground">Image</th>
                <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground">Name</th>
                <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground">Category</th>
                <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground">Condition</th>
                <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground">Price</th>
                <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground">Stock</th>
                <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground">Status</th>
                <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <tr key={product.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                  <td className="px-3 py-2">
                    {product.cover_image ? (
                      <img src={product.cover_image} alt={product.name} className="size-9 rounded-lg object-cover border border-border" />
                    ) : (
                      <div className="size-9 rounded-lg bg-secondary flex items-center justify-center">
                        <Package className="size-4 text-muted-foreground" />
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 font-medium text-foreground max-w-[160px] truncate">{product.name}</td>
                  <td className="px-3 py-2">
                    <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
                      {product.condition.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-semibold text-foreground">₹{product.price.toLocaleString("en-IN")}</td>
                  <td className="px-3 py-2">
                    <span className={product.stock > 0 ? "text-[#48C479] font-semibold" : "text-red-500 font-semibold"}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${product.active ? "bg-[#48C479]/10 text-[#48C479]" : "bg-red-500/10 text-red-500"}`}>
                      {product.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setEditingProduct(product); setFormOpen(true); }}
                        className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                        title="Edit"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        onClick={() => { setDeletingProduct(product); setDeleteOpen(true); }}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialogs */}
      <ProductFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingProduct(null); }}
        product={editingProduct}
        brands={brands}
        models={models}
        onSave={handleSave}
        saving={saving}
      />
      <DeleteConfirmDialog
        open={deleteOpen}
        onClose={() => { setDeleteOpen(false); setDeletingProduct(null); }}
        onConfirm={handleDelete}
        productName={deletingProduct?.name || ""}
        deleting={deleting}
      />
    </div>
  );
}
