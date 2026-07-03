"use client";

import { ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck, Sparkles, User } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import logo from "@/assets/looplic-logo.webp";
import { OAUTH_REDIRECT_COOKIE, sanitizeRedirect } from "@/src/lib/auth-redirect";
import { getClientSession, signInWithEmail, signInWithGoogle, signOutClient, signUpWithEmail } from "@/src/lib/auth/cognito-client";

export function AuthPageClient() {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState<"email" | "google" | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const router = useRouter();
  const redirectParam = searchParams.get("redirect");
  const redirect = sanitizeRedirect(redirectParam);

  useEffect(() => {
    let ignore = false;

    async function checkSession() {
      const { user } = await getClientSession();

      if (ignore) return;

      if (user) {
        router.replace(redirect);
        router.refresh();
        return;
      }

      setCheckingSession(false);
    }

    checkSession();

    return () => {
      ignore = true;
    };
  }, [redirect, router]);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  function navigateAfterAuth(target: string) {
    if (typeof window !== "undefined") {
      window.location.assign(target);
      return;
    }

    router.replace(target);
    router.refresh();
  }

  function setAuthMode(nextMode: "login" | "signup") {
    setMode(nextMode);
    const nextQuery = new URLSearchParams(searchParams.toString());
    nextQuery.set("mode", nextMode);
    router.replace(`/auth?${nextQuery.toString()}`, { scroll: false });
  }

  async function handleGoogleAuth() {
    setSubmitting("google");
    document.cookie = `${OAUTH_REDIRECT_COOKIE}=${encodeURIComponent(redirect)}; Path=/; Max-Age=600; SameSite=Lax${window.location.protocol === "https:" ? "; Secure" : ""}`;
    try {
      await signInWithGoogle(redirect);
    } catch (err: any) {
      toast.error(err.message || "Google sign in failed");
      setSubmitting(null);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      return;
    }

    if (mode === "signup" && !name.trim()) {
      return;
    }

    setSubmitting("email");

    if (mode === "login") {
      try {
        const result = await signInWithEmail(email, password);
        if (result.isSignedIn) {
          toast.success("Welcome back!");
          navigateAfterAuth(redirect);
        } else {
          toast.error("Sign in incomplete. Check your email for a verification link.");
        }
      } catch (err: any) {
        toast.error(err.message || "Sign in failed");
      }
      setSubmitting(null);
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      setSubmitting(null);
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      setSubmitting(null);
      return;
    }

    try {
      const result = await signUpWithEmail(email, password, name);
      if (result.isSignUpComplete) {
        toast.success("Account created!");
        navigateAfterAuth(redirect);
      } else {
        toast.success("Account created. Verify your email to complete sign in.");
        router.replace("/");
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || "Sign up failed");
    }
    setSubmitting(null);
  }

  if (checkingSession) {
    return (
      <main className="flex flex-1 items-center justify-center p-4">
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
          <Loader2 className="size-4 animate-spin text-primary" />
          Preparing secure sign in&hellip;
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 items-center justify-center p-4 sm:p-6">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-border bg-card shadow-elevated-brand lg:grid-cols-[1.02fr_0.98fr]">
        <section className="hidden border-r border-border bg-[radial-gradient(circle_at_top_left,_hsl(211_100%_50%_/_0.14),_transparent_35%),radial-gradient(circle_at_75%_20%,_hsl(165_100%_42%_/_0.12),_transparent_28%),linear-gradient(180deg,_rgba(255,255,255,0)_0%,_rgba(248,250,252,0.96)_100%)] p-8 lg:block">
          <Link href="/">
            <img src={logo.src} alt="Looplic" className="h-8" />
          </Link>
          <div className="mt-10 max-w-md">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              <ShieldCheck className="size-3.5" />
              Secure access
            </div>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-foreground">
              {mode === "login" ? "Sign in and get back to your bookings fast." : "Create your Looplic account in a minute."}
            </h1>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Continue with Google or use your email and password. Once you&apos;re in, we&apos;ll take you straight back to the app flow.
            </p>
          </div>
          <div className="mt-8 grid gap-3">
            {[
              { icon: Sparkles, title: "Smooth app-style flow", text: "Authentication stays quick, clean, and redirect-safe." },
              { icon: CheckCircle2, title: "Bookings tied to your account", text: "Track service requests, updates, and saved profile details in one place." },
              { icon: ArrowRight, title: "Fast return to the homepage", text: "After sign in or account creation, you land back in the main experience." },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-border/70 bg-card/80 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <item.icon className="size-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">{item.title}</div>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="p-5 sm:p-7">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-6 text-center lg:text-left">
              <Link href="/" className="inline-flex lg:hidden">
                <img src={logo.src} alt="Looplic" className="mx-auto mb-4 h-8" />
              </Link>
              <div className="inline-flex rounded-full border border-border bg-background p-1">
                <button
                  type="button"
                  onClick={() => setAuthMode("login")}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${mode === "login" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode("signup")}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${mode === "signup" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                >
                  Create Account
                </button>
              </div>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">{mode === "login" ? "Welcome back" : "Create your account"}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {mode === "login" ? "Sign in to continue with your bookings and saved details." : "Set up your account and jump right into the Looplic experience."}
              </p>
            </div>

            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={submitting !== null}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-border bg-background text-sm font-bold text-foreground transition-colors hover:bg-secondary disabled:opacity-60"
            >
              {submitting === "google" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
                  <path fill="#4285F4" d="M21.8 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.5a4.7 4.7 0 0 1-2 3.1v2.6h3.3c1.9-1.8 3-4.3 3-7.5Z" />
                  <path fill="#34A853" d="M12 22c2.7 0 5-1 6.7-2.7l-3.3-2.6c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z" />
                  <path fill="#FBBC05" d="M6.4 13.5A6 6 0 0 1 6 12c0-.5.1-1 .3-1.5V7.9H3.1A10 10 0 0 0 2 12c0 1.6.4 3 1.1 4.1l3.3-2.6Z" />
                  <path fill="#EA4335" d="M12 6.4c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 12 2a10 10 0 0 0-8.9 5.9l3.3 2.6c.8-2.4 3-4.1 5.6-4.1Z" />
                </svg>
              )}
              Continue with Google
            </button>

            <div className="my-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              or use email
              <div className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "signup" ? (
            <div className="relative">
              <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                maxLength={100}
                className="w-full rounded-2xl border border-border bg-card py-3 pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          ) : null}

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              maxLength={255}
              className="w-full rounded-2xl border border-border bg-card py-3 pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              maxLength={72}
              className="w-full rounded-2xl border border-border bg-card py-3 pl-10 pr-10 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>

          {mode === "signup" ? (
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                minLength={6}
                maxLength={72}
                className="w-full rounded-2xl border border-border bg-card py-3 pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting !== null}
            className="flex w-full items-center justify-center gap-2 rounded-2xl gradient-brand py-3.5 text-sm font-extrabold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {submitting === "email" ? <Loader2 className="size-4 animate-spin" /> : null}
            {mode === "login" ? "Sign In" : "Create Account"}
          </button>
            </form>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              {mode === "login" ? (
                <>
                  Don&apos;t have an account?{" "}
                  <button type="button" onClick={() => setAuthMode("signup")} className="font-bold text-primary">
                    Create one
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button type="button" onClick={() => setAuthMode("login")} className="font-bold text-primary">
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
