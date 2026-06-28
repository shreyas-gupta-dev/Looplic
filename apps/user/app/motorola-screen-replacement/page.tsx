import { buildSeoServiceMetadata, SeoServicePage } from "@/src/components/next/SeoServicePage";

const slug = "motorola-screen-replacement";

export const metadata = buildSeoServiceMetadata(slug);

export default function Page() {
  return <SeoServicePage slug={slug} />;
}
