import { OperationLoginClient } from "@/src/components/next/OperationLoginClient";
import { buildMigrationMetadata } from "@/src/lib/metadata";

export const metadata = buildMigrationMetadata("Operation Login", "/operation/login");

export default function OperationLoginPage() {
  return <OperationLoginClient />;
}
