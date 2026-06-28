import { buildMigrationMetadata } from "@/src/lib/metadata";
import { AdminLoginClient } from "@/src/components/next/AdminLoginClient";

export const metadata = buildMigrationMetadata("Admin Login", "/admin/login");

export default function AdminLoginPage() {
  return <AdminLoginClient />;
}
