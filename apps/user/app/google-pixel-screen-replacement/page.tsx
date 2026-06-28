import { buildSeoServiceMetadata, SeoServicePage } from "@/src/components/next/SeoServicePage";

const slug = "google-pixel-screen-replacement";

export const metadata = buildSeoServiceMetadata(slug);

export default function Page() {
  return <SeoServicePage slug={slug} />;
}
