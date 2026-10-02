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
  const [directResetUrl, setDirectResetUrl] = useState<string | null>(null);
  const [pastedInput, setPastedInput] = useState("");
  const [verifyingPasted, setVerifyingPasted] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function detectRecoverySession() {
      const supabase = getBrowserSupabase();

      // 1. Query parameter token_hash (direct recovery link)
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");
      if (tokenHash && (type === "recovery" || !type)) {
        try {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "recovery",
          });
          if (cancelled) return;
          if (error) {
            toast.error(error.message || "That reset link is no longer valid. Please request a new one.");
            setPhase("request");
            return;
          }
          if (data.session) {
            setPhase("update");
            return;
          }
        } catch (err) {
          console.error("verifyOtp error:", err);
        }
      }

      // 2. Hash fragment access_token (from Supabase redirect or pasted address)
      if (typeof window !== "undefined" && window.location.hash) {
        const hash = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hash);
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const errorCode = hashParams.get("error_code") || hashParams.get("error");
        const errorDesc = hashParams.get("error_description");

        if (errorCode || errorDesc) {
          toast.error(errorDesc ? decodeURIComponent(errorDesc.replace(/\+/g, " ")) : "That reset link is no longer valid.");
          setPhase("request");
          return;
        }

        if (accessToken) {
          try {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || "",
            });
            if (cancelled) return;
            if (!error && data.session) {
              setPhase("update");
              return;
            }
          } catch (err) {
            console.error("setSession error:", err);
          }
        }
      }

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
    setDirectResetUrl(null);
    try {
      const res = await requestPasswordReset(email);
      setSent(true);
      if (res.directResetUrl) {
        setDirectResetUrl(res.directResetUrl);
      }
      toast.success("If that email has an account, a reset link is on its way.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not send the reset link");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePastedTokenOrUrl(e: React.FormEvent) {
    e.preventDefault();
    const raw = pastedInput.trim();
    if (!raw) return;

    setVerifyingPasted(true);
    const supabase = getBrowserSupabase();

    try {
      // Case A: Full URL or hash with access_token=
      if (raw.includes("access_token=")) {
        const hash = raw.includes("#") ? raw.split("#")[1] : raw.includes("?") ? raw.split("?")[1] : raw;
        const params = new URLSearchParams(hash);
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (accessToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || "",
          });
          if (error) throw new Error(error.message);
          if (data.session) {
            setPhase("update");
            toast.success("Token verified. Please enter your new password.");
            return;
          }
        }
      }

      // Case B: token_hash parameter
      if (raw.includes("token_hash=")) {
        const params = new URLSearchParams(raw.includes("?") ? raw.split("?")[1] : raw);
        const tokenHash = params.get("token_hash");
        if (tokenHash) {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "recovery",
          });
          if (error) throw new Error(error.message);
          if (data.session) {
            setPhase("update");
            toast.success("Link verified. Please enter your new password.");
            return;
          }
        }
      }

      // Case C: Numeric 6-8 digit code
      if (/^\d{6,8}$/.test(raw)) {
        if (!email.trim()) {
          toast.error("Please enter your account email first.");
          return;
        }
        const { data, error } = await supabase.auth.verifyOtp({
          email: email.trim().toLowerCase(),
          token: raw,
          type: "recovery",
        });
        if (error) throw new Error(error.message);
        if (data.session) {
          setPhase("update");
          toast.success("Code verified. Please enter your new password.");
          return;
        }
      }

      toast.error("Could not recognize that link or token. Please paste the full address from your browser.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Verification failed. Please try again.");
    } finally {
      setVerifyingPasted(false);
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

                {directResetUrl && (
                  <div className="mt-4 pt-3 border-t border-border">
                    <p className="text-xs font-medium text-foreground mb-1.5">
                      Ready to set your password?
                    </p>
                    <a
                      href={directResetUrl}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl gradient-brand py-2.5 text-xs font-bold text-white shadow-sm hover:opacity-95"
                    >
                      Set New Password Directly &rarr;
                    </a>
                  </div>
                )}
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

            {/* Helper for users whose email link was redirected to localhost */}
            <div className="mt-6 rounded-2xl border border-dashed border-border p-4 bg-muted/20">
              <p className="text-xs font-semibold text-foreground">
                Already clicked the link in your email?
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                If the email button redirected you to a <code>localhost:3000</code> address, paste that address or code here to continue:
              </p>
              <form onSubmit={handlePastedTokenOrUrl} className="mt-3 space-y-2">
                <input
                  type="text"
                  placeholder="Paste URL (e.g. localhost:3000/#access_token=...) or code"
                  value={pastedInput}
                  onChange={(e) => setPastedInput(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card py-2 px-3 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button
                  type="submit"
                  disabled={verifyingPasted || !pastedInput.trim()}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground shadow-sm hover:bg-muted transition-colors disabled:opacity-50"
                >
                  {verifyingPasted ? <Loader2 className="size-3.5 animate-spin" /> : null}
                  Verify Link / Token &rarr;
                </button>
              </form>
            </div>
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
