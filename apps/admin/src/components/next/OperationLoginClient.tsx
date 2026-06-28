"use client";

import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useRoleSession } from "@/src/hooks/useRoleSession";

type OperationLoginClientProps = {
  dashboardPath?: string;
  title?: string;
  badge?: string;
};

export function OperationLoginClient({
  dashboardPath = "/operation",
  title = "Operation Login",
  badge = "Looplic Operations",
}: OperationLoginClientProps) {
  const router = useRouter();
  const { signIn, hasRole, loading, user } = useRoleSession("operation");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user && hasRole) {
      router.replace(dashboardPath);
    }
  }, [dashboardPath, hasRole, loading, router, user]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    const { error: signInError } = await signIn(email, password);

    if (signInError) {
      setError(signInError.message);
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-primary" />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            {badge}
          </div>
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          <p className="mt-1 text-xs text-muted-foreground">Sign in to manage technician assignment, billing, and order follow-up.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-[2rem] border border-border bg-card p-6 shadow-card-brand">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="email"
              placeholder="operations@looplic.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-12 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>

          {error ? <p className="text-center text-xs font-medium text-destructive">{error}</p> : null}
          {user && !hasRole ? <p className="text-center text-xs font-medium text-destructive">This account does not have operation access.</p> : null}

          <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl gradient-brand py-3 text-sm font-bold text-primary-foreground disabled:opacity-60">
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </main>
  );
}
