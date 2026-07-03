import { OperatorDashboardClient } from "@/src/components/next/OperatorDashboardClient";
import { buildMigrationMetadata } from "@/src/lib/metadata";

export const metadata = buildMigrationMetadata("Operator Dashboard", "/operator");

export default function OperatorPage() {
  return <OperatorDashboardClient loginPath="/operator/login" />;
}
