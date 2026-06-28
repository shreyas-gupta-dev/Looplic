import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-card-brand">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">404</p>
        <h1 className="mt-3 text-2xl font-semibold text-foreground">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This slug-based Next.js route exists in the new app shell, but the requested page was not found.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}
