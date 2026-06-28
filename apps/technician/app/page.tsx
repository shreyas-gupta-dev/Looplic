import { redirect } from "next/navigation";

// The technician deployment has no public landing page — send the root straight
// to the technician dashboard (which itself gates on login).
export default function TechnicianRootPage() {
  redirect("/technician");
}
