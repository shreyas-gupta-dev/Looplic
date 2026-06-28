import { redirect } from "next/navigation";

// The admin deployment has no public landing page — send the root straight to
// the admin login.
export default function AdminRootPage() {
  redirect("/admin/login");
}
