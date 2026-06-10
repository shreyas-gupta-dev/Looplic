import { buildSeoServiceMetadata, SeoServicePage } from "@/src/components/next/SeoServicePage";

const slug = "laptop-keyboard-repair";

export const metadata = buildSeoServiceMetadata(slug);

export default function Page() {
  return <SeoServicePage slug={slug} />;
}
