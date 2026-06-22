"use client";

import { useEffect } from "react";

function isChunkLoadError(error?: Error) {
  if (!error) return false;
  return (
    error.name === "ChunkLoadError" ||
    /loading chunk|loading css chunk|dynamically imported module|importing a module script failed/i.test(error.message || "")
  );
}

export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // A stale deploy can leave the browser asking for chunk hashes that no longer
    // exist. Force one fresh reload to pick up the current build.
    if (isChunkLoadError(error) && typeof window !== "undefined") {
      const key = "looplic-chunk-reloaded";
      if (!window.sessionStorage.getItem(key)) {
        window.sessionStorage.setItem(key, "1");
        window.location.reload();
        return;
      }
    }
    // eslint-disable-next-line no-console
    console.error("Route error boundary caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">Something went wrong</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          We hit a temporary problem loading this page. Please try again — your details are not lost.
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-bold text-foreground transition-colors hover:border-primary/30"
          >
            Reload page
          </button>
        </div>
        <details className="mt-4 text-left">
          <summary className="cursor-pointer text-xs text-muted-foreground">Technical details</summary>
          <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-secondary/60 p-3 text-left text-[11px] leading-5 text-foreground">
{`message: ${error?.message || "(none)"}
name: ${error?.name || "(none)"}
digest: ${error?.digest || "(none)"}
stack: ${error?.stack || "(none)"}`}
          </pre>
        </details>
      </div>
    </div>
  );
}
