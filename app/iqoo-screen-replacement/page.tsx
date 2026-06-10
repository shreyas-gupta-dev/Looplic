import { buildSeoServiceMetadata, SeoServicePage } from "@/src/components/next/SeoServicePage";

const slug = "iqoo-screen-replacement";

export const metadata = buildSeoServiceMetadata(slug);

export default function Page() {
  return <SeoServicePage slug={slug} />;
}
