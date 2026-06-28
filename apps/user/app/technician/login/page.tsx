import { TechnicianLoginClient } from "@/src/components/next/TechnicianLoginClient";
import { buildMigrationMetadata } from "@/src/lib/metadata";

export const metadata = buildMigrationMetadata("Technician Login", "/technician/login");

export default function TechnicianLoginPage() {
  return <TechnicianLoginClient />;
}
