import { createPublicClient } from "@/src/lib/data-client/public";

// A blog post as stored by the admin CMS and rendered on the public site.
// Column names are snake_case to match what the data client returns.
export type DbBlogPost = {
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

// A post is publicly visible only when it is published AND its publish time has
// arrived (a future published_at is a scheduled post, kept hidden until then).
function isLive(post: DbBlogPost): boolean {
  if (post.status !== "published") return false;
  if (post.published_at && new Date(post.published_at).getTime() > Date.now()) return false;
  return true;
}

export async function getPublishedPosts(): Promise<DbBlogPost[]> {
  const client = createPublicClient();
  const { data } = await client.from("blog_posts").select("*").eq("status", "published").order("published_at");
  const rows = ((data ?? []) as DbBlogPost[]).filter(isLive);
  // Newest first. published_at is an ISO string, so a string compare orders correctly.
  return rows.sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""));
}

export async function getPublishedPost(slug: string): Promise<DbBlogPost | null> {
  const client = createPublicClient();
  const { data } = await client.from("blog_posts").select("*").eq("slug", slug).maybeSingle();
  const post = data as DbBlogPost | null;
  if (!post || !isLive(post)) return null;
  return post;
}
