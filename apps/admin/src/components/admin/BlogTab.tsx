"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/src/lib/data-client/client";
import { toast } from "sonner";
import { ArrowLeft, ImagePlus, Loader2, Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { slugify } from "@/src/lib/slug";
import { RichTextEditor, uploadImageToS3 } from "@/src/components/admin/RichTextEditor";

// Lazily-resolved data client, same pattern as the other admin tabs.
const dataClient = new Proxy({} as any, { get: (_t, p) => (createClient() as any)[p] });

type BlogPostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body_html: string;
  cover_image_url: string | null;
  cover_image_alt: string;
  status: string;
  published_at: string | null;
  author: string;
  category: string;
  tags: string[] | null;
  reading_time: string;
  seo_title: string;
  seo_description: string;
  og_image_url: string | null;
  updated_at: string;
};

type FormState = {
  title: string;
  slug: string;
  excerpt: string;
  bodyHtml: string;
  coverImageUrl: string;
  coverImageAlt: string;
  status: string;
  publishedAt: string; // datetime-local value
  author: string;
  category: string;
  tags: string;
  readingTime: string;
  seoTitle: string;
  seoDescription: string;
};

const EMPTY_FORM: FormState = {
  title: "", slug: "", excerpt: "", bodyHtml: "", coverImageUrl: "", coverImageAlt: "",
  status: "draft", publishedAt: "", author: "Looplic Editorial Team", category: "",
  tags: "", readingTime: "", seoTitle: "", seoDescription: "",
};

// Convert a stored ISO timestamp to the value a datetime-local input expects.
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function estimateReadingTime(html: string): string {
  const words = html.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
}

export default function BlogTab() {
  const [posts, setPosts] = useState<BlogPostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null); // null = list; "new" = create
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await dataClient.from("blog_posts").select("*").order("updated_at");
    if (error) toast.error(error.message || "Failed to load posts");
    // order() is ascending in the data client; show newest first.
    setPosts(((data ?? []) as BlogPostRow[]).slice().reverse());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openNew() {
    setForm(EMPTY_FORM);
    setEditingId("new");
  }

  function openEdit(post: BlogPostRow) {
    setForm({
      title: post.title, slug: post.slug, excerpt: post.excerpt, bodyHtml: post.body_html,
      coverImageUrl: post.cover_image_url ?? "", coverImageAlt: post.cover_image_alt,
      status: post.status, publishedAt: toLocalInput(post.published_at), author: post.author,
      category: post.category, tags: (post.tags ?? []).join(", "), readingTime: post.reading_time,
      seoTitle: post.seo_title, seoDescription: post.seo_description,
    });
    setEditingId(post.id);
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function pickCover() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setUploadingCover(true);
      const url = await uploadImageToS3(file);
      setUploadingCover(false);
      if (url) set("coverImageUrl", url);
    };
    input.click();
  }

  async function save() {
    const title = form.title.trim();
    if (!title) { toast.error("Enter a title"); return; }
    const slug = (form.slug.trim() ? slugify(form.slug) : slugify(title));
    if (!slug) { toast.error("Enter a valid slug"); return; }

    const tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);
    const readingTime = form.readingTime.trim() || estimateReadingTime(form.bodyHtml);
    // When publishing without an explicit time, stamp "now".
    let publishedAt: string | null = form.publishedAt ? new Date(form.publishedAt).toISOString() : null;
    if (form.status === "published" && !publishedAt) publishedAt = new Date().toISOString();

    const payload = {
      slug, title, excerpt: form.excerpt.trim(), body_html: form.bodyHtml,
      cover_image_url: form.coverImageUrl || null, cover_image_alt: form.coverImageAlt.trim(),
      status: form.status, published_at: publishedAt, author: form.author.trim(),
      category: form.category.trim(), tags, reading_time: readingTime,
      seo_title: form.seoTitle.trim(), seo_description: form.seoDescription.trim(),
      updated_at: new Date().toISOString(),
    };

    setSaving(true);
    if (editingId && editingId !== "new") {
      const { error } = await dataClient.from("blog_posts").update(payload).eq("id", editingId);
      setSaving(false);
      if (error) { toast.error(error.message || "Failed to save"); return; }
      toast.success("Post updated");
    } else {
      const { error } = await dataClient.from("blog_posts").insert(payload);
      setSaving(false);
      if (error) { toast.error(error.message || "Failed to create post"); return; }
      toast.success("Post created");
    }
    setEditingId(null);
    load();
  }

  async function remove(post: BlogPostRow) {
    if (!window.confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    const { error } = await dataClient.from("blog_posts").delete().eq("id", post.id);
    if (error) { toast.error(error.message || "Failed to delete (admins only)"); return; }
    toast.success("Post deleted");
    load();
  }

  // ---- List view ----
  if (!editingId) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-foreground">Blog</h2>
            <p className="text-xs text-muted-foreground">Write and publish articles for looplic.com/blog</p>
          </div>
          <Button onClick={openNew} className="gap-1.5"><Plus className="size-4" /> New post</Button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Loading…</div>
        ) : posts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No posts yet. Create your first article.</div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary text-xs font-bold uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">{post.title}</div>
                      <div className="text-xs text-muted-foreground">/blog/{post.slug}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${post.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {post.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(post.updated_at).toLocaleDateString("en-IN")}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" className="gap-1" onClick={() => openEdit(post)}><Pencil className="size-3.5" /> Edit</Button>
                        <Button variant="outline" size="sm" className="gap-1 text-red-600" onClick={() => remove(post)}><Trash2 className="size-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // ---- Editor view ----
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <Button variant="ghost" className="gap-1.5" onClick={() => setEditingId(null)}><ArrowLeft className="size-4" /> Back</Button>
        <div className="flex items-center gap-2">
          <select
            value={form.status}
            onChange={(e) => set("status", e.target.value)}
            className="h-9 rounded-md border border-border bg-background px-3 text-sm"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          <Button onClick={save} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            {editingId === "new" ? "Create" : "Save"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        <div>
          <Label>Title</Label>
          <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="How to pick a reliable phone repair service" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Slug</Label>
            <Input value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="auto-generated from title" />
          </div>
          <div>
            <Label>Category</Label>
            <Input value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="Repair Guides" />
          </div>
        </div>

        <div>
          <Label>Excerpt</Label>
          <Textarea value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} rows={2} placeholder="One or two sentences shown in listings and search results." />
        </div>

        <div className="grid gap-4 sm:grid-cols-[200px_1fr] sm:items-start">
          <div>
            <Label>Cover image</Label>
            <div className="mt-1 overflow-hidden rounded-lg border border-border bg-secondary">
              {form.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.coverImageUrl} alt="cover" className="h-28 w-full object-cover" />
              ) : (
                <div className="flex h-28 items-center justify-center text-xs text-muted-foreground">No image</div>
              )}
            </div>
            <Button variant="outline" size="sm" className="mt-2 w-full gap-1.5" onClick={pickCover} disabled={uploadingCover}>
              {uploadingCover ? <Loader2 className="size-3.5 animate-spin" /> : <ImagePlus className="size-3.5" />}
              {form.coverImageUrl ? "Replace" : "Upload"}
            </Button>
          </div>
          <div className="space-y-4">
            <div>
              <Label>Cover alt text (SEO)</Label>
              <Input value={form.coverImageAlt} onChange={(e) => set("coverImageAlt", e.target.value)} placeholder="Describe the image for accessibility & SEO" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Author</Label>
                <Input value={form.author} onChange={(e) => set("author", e.target.value)} />
              </div>
              <div>
                <Label>Tags (comma-separated)</Label>
                <Input value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="mobile repair, bangalore" />
              </div>
            </div>
          </div>
        </div>

        <div>
          <Label>Body</Label>
          <RichTextEditor value={form.bodyHtml} onChange={(html) => set("bodyHtml", html)} />
        </div>

        <details className="rounded-xl border border-border p-4">
          <summary className="cursor-pointer text-sm font-bold text-foreground">SEO &amp; scheduling</summary>
          <div className="mt-4 grid gap-4">
            <div>
              <Label>SEO title</Label>
              <Input value={form.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} placeholder="Defaults to the post title" />
            </div>
            <div>
              <Label>SEO description</Label>
              <Textarea value={form.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} rows={2} placeholder="Defaults to the excerpt" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Reading time</Label>
                <Input value={form.readingTime} onChange={(e) => set("readingTime", e.target.value)} placeholder="auto-estimated" />
              </div>
              <div>
                <Label>Publish date/time</Label>
                <Input type="datetime-local" value={form.publishedAt} onChange={(e) => set("publishedAt", e.target.value)} />
                <p className="mt-1 text-xs text-muted-foreground">Future time = scheduled; hidden until then.</p>
              </div>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
