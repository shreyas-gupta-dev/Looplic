import { OperationLoginClient } from "@/src/components/next/OperationLoginClient";
import { buildMigrationMetadata } from "@/src/lib/metadata";

export const metadata = buildMigrationMetadata("Operator Login", "/operator/login");

export default function OperatorLoginPage() {
  return <OperationLoginClient dashboardPath="/operator" title="Operator Login" badge="Looplic Operator" />;
}
