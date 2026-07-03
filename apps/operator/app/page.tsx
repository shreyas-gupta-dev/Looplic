import { redirect } from "next/navigation";

// The operator deployment has no public landing page — send the root straight
// to the operator login.
export default function OperatorRootPage() {
  redirect("/operator/login");
}
