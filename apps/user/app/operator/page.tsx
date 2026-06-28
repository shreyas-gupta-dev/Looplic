import { OperationDashboardClient } from "@/src/components/next/OperationDashboardClient";
import { buildMigrationMetadata } from "@/src/lib/metadata";

export const metadata = buildMigrationMetadata("Operator Dashboard", "/operator");

export default function OperatorPage() {
  return <OperationDashboardClient loginPath="/operator/login" />;
}
