"use client";

import { useEffect } from "react";

// global-error replaces the root layout, so it must render its own <html>/<body>
// and cannot rely on app styles. It only fires for errors thrown in the root
// layout itself; route-level errors are handled by app/error.tsx.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("Global error boundary caught:", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, sans-serif", background: "#f8fafc" }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
          <div style={{ maxWidth: 420, width: "100%", textAlign: "center", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 24 }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>Something went wrong</h2>
            <p style={{ marginTop: 8, fontSize: "0.875rem", lineHeight: 1.6, color: "#64748b" }}>
              Please try again or reload the page.
            </p>
            <div style={{ marginTop: 20, display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                type="button"
                onClick={() => reset()}
                style={{ borderRadius: 12, background: "#2563eb", color: "#fff", border: "none", padding: "8px 16px", fontSize: "0.875rem", fontWeight: 700, cursor: "pointer" }}
              >
                Try again
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{ borderRadius: 12, background: "#fff", color: "#0f172a", border: "1px solid #e2e8f0", padding: "8px 16px", fontSize: "0.875rem", fontWeight: 700, cursor: "pointer" }}
              >
                Reload page
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
