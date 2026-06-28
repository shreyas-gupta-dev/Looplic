import { OperationDashboardClient } from "@/src/components/next/OperationDashboardClient";
import { buildMigrationMetadata } from "@/src/lib/metadata";

export const metadata = buildMigrationMetadata("Operation Dashboard", "/operation");

export default function OperationPage() {
  return <OperationDashboardClient />;
}
