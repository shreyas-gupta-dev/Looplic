"use client";

import { ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { getBrowserSupabase } from "@/src/lib/supabase/browser";
import { completePasswordReset, requestPasswordReset } from "@/src/lib/auth/cognito-client";

/**
 * Password reset, both halves of it.
 *
 *   "request" — the customer asks for a reset link.
 *   "update"  — the customer arrived from that link and sets a new password.
 *
 * Which half renders is decided by whether Supabase has put a recovery session
 * in place. The recovery link lands on /auth/callback, which exchanges the code
 * and redirects here with a session already established, so we only have to look
 * for one.
 *
 * Before this existed there was no recovery path at all: a customer who forgot
 * their password could not get back into their account by any means.
 */
export function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [phase, setPhase] = useState<"checking" | "request" | "update">("checking");
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function detectRecoverySession() {
      const supabase = getBrowserSupabase();
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;

      // An error in the URL means the link was already used or has expired.
      const errorDescription = searchParams.get("error_description") ?? searchParams.get("error");
      if (errorDescription) {
        toast.error("That reset link is no longer valid. Please request a new one.");
        setPhase("request");
        return;
      }

      setPhase(data.session ? "update" : "request");
    }

    void detectRecoverySession();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  async function handleRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
      // Deliberately the same message whether or not the address has an account,
      // so this form cannot be used to discover who is registered.
      toast.success("If that email has an account, a reset link is on its way.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not send the reset link");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      await completePasswordReset(password);
      toast.success("Password updated. You are signed in.");
      router.replace("/account");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not update your password");
    } finally {
      setSubmitting(false);
    }
  }

  if (phase === "checking") {
    return (
      <main className="flex flex-1 items-center justify-center p-4">
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
          <Loader2 className="size-4 animate-spin text-primary" />
          Checking your reset link&hellip;
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md rounded-[28px] border border-border bg-card p-6 shadow-elevated-brand sm:p-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          <ShieldCheck className="size-3.5" />
          Password reset
        </div>

        {phase === "request" ? (
          <>
            <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
              Reset your password
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Enter the email address on your Looplic account and we will send you a link to set a new
              password.
            </p>

            {sent ? (
              <div className="mt-6 rounded-2xl border border-border bg-muted/40 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 size-4 text-primary" />
                  <div className="text-sm leading-6 text-foreground">
                    <p className="font-semibold">Check your inbox</p>
                    <p className="mt-1 text-muted-foreground">
                      If <span className="font-medium text-foreground">{email.trim()}</span> has a Looplic
                      account, a reset link is on its way. The link expires in one hour and can be used
                      once.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="mt-4 text-xs font-semibold text-primary underline-offset-4 hover:underline"
                >
                  Use a different email
                </button>
              </div>
            ) : (
              <form onSubmit={handleRequest} className="mt-6 space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    aria-label="Email address"
                    className="w-full rounded-2xl border border-border bg-card py-3 pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl gradient-brand py-3.5 text-sm font-extrabold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
                  {submitting ? "Sending link..." : "Send reset link"}
                </button>
              </form>
            )}
          </>
        ) : (
          <>
            <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
              Choose a new password
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Pick something you have not used here before. You will be signed in straight after.
            </p>

            <form onSubmit={handleUpdate} className="mt-6 space-y-4">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="New password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={6}
                  maxLength={72}
                  aria-label="New password"
                  className="w-full rounded-2xl border border-border bg-card py-3 pl-10 pr-10 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  minLength={6}
                  maxLength={72}
                  aria-label="Confirm new password"
                  className="w-full rounded-2xl border border-border bg-card py-3 pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-2xl gradient-brand py-3.5 text-sm font-extrabold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
              >
                {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
                {submitting ? "Updating..." : "Update password"}
              </button>
            </form>
          </>
        )}

        <Link
          href="/auth"
          className="mt-6 inline-flex items-center gap-1.5 rounded text-xs font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          <ArrowLeft className="size-3.5" />
          Back to sign in
        </Link>
      </div>
    </main>
  );
}
