import { buildSeoServiceMetadata, SeoServicePage } from "@/src/components/next/SeoServicePage";

const slug = "data-recovery-service";

export const metadata = buildSeoServiceMetadata(slug);

export default function Page() {
  return <SeoServicePage slug={slug} />;
}
