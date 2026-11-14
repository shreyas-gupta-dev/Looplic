import type { Metadata } from "next";

import { InfoPageLayout } from "@/src/components/next/InfoPageLayout";
import { companyName, supportEmail, supportPhoneDisplay } from "@/src/lib/company";
import { buildPageMetadata } from "@/src/lib/metadata";
import { getServerSupabase } from "@/src/lib/supabase/server";
import { AccountDeleteActions } from "./AccountDeleteActions";

export const metadata: Metadata = buildPageMetadata({
  title: "Request Account & Data Deletion",
  description: `Learn how to request deletion of your ${companyName} account and associated personal data in accordance with our data privacy policies.`,
  pathname: "/account/delete",
});

export default async function AccountDeletePage() {
  let userEmail: string | null = null;
  let isSignedIn = false;

  try {
    const supabase = await getServerSupabase();
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      isSignedIn = true;
      userEmail = data.user.email || null;
    }
  } catch {
    // Session-check fallback for public or crawler visits
  }

  return (
    <InfoPageLayout
      eyebrow="Account Support"
      title="Request Account & Data Deletion"
      description={`We respect your privacy and provide a clear, transparent process to request deletion of your ${companyName} account and associated personal data.`}
    >
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Account Deletion Options</h2>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          You can initiate deletion directly below if you are currently logged in, or request deletion by contacting our privacy and support team.
        </p>

        <div className="mt-6">
          <AccountDeleteActions initialEmail={userEmail} isSignedIn={isSignedIn} />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Deletion Process & Timeline</h2>
        <div className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
          <p>
            <strong>1-Click Instant Deletion (Signed In):</strong> When confirmed through your active session, your profile, authentication credentials, and stored personal data are deleted immediately.
          </p>
          <p>
            <strong>Support Request (Email or Phone):</strong> If you cannot access your account, email our support team from your registered email address. Once identity verification is completed, your account is permanently purged within 30 days.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">What Data Is Deleted</h2>
        <ul className="mt-4 list-inside list-disc space-y-2 text-sm leading-7 text-muted-foreground">
          <li>Your personal profile (name, email address, mobile phone number).</li>
          <li>Saved service, delivery, and pickup addresses.</li>
          <li>Authentication records, active sessions, and login tokens.</li>
          <li>Active shopping carts and marketing communication preferences.</li>
        </ul>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Data Retention Exceptions</h2>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          In accordance with statutory Indian taxation, accounting, and consumer protection laws (including GST records and commercial transaction regulations), records of completed repair orders, buyback invoices, and warranty fulfillment logs must be retained for legally mandated retention periods. These records are held strictly for audit and legal compliance and cannot be used for marketing or re-engagement.
        </p>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Contact Support</h2>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          For any questions regarding account deletion or data privacy, reach out to our dedicated support team at <strong>{supportEmail}</strong> or call <strong>{supportPhoneDisplay}</strong>.
        </p>
      </section>
    </InfoPageLayout>
  );
}
