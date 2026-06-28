import { buildMigrationMetadata } from "@/src/lib/metadata";
import { AdminDashboardClient } from "@/src/components/next/AdminDashboardClient";

export const metadata = buildMigrationMetadata("Admin Dashboard", "/admin/dashboard");

export default function AdminDashboardPage() {
  return <AdminDashboardClient />;
}
