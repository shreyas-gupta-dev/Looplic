import { TechnicianDashboardClient } from "@/src/components/next/TechnicianDashboardClient";
import { buildMigrationMetadata } from "@/src/lib/metadata";

export const metadata = {
  ...buildMigrationMetadata("Technician Dashboard", "/technician"),
  manifest: "/technician/manifest.webmanifest",
  applicationName: "Looplic Technician",
  appleWebApp: {
    capable: true,
    title: "Looplic Technician",
    statusBarStyle: "default",
  },
};

export default function TechnicianPage() {
  return <TechnicianDashboardClient />;
}
