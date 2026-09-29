"use client";

import { Camera, CheckCircle2, Loader2, PlayCircle, StopCircle, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Technician-side capture panel for the repair live view.
 *
 * Opens a viewing window on one booking, lets the technician photograph each stage
 * of the repair, and closes the window when the job is done. Everything the
 * customer sees comes from here.
 *
 * Uses the device camera directly (capture="environment"), because the realistic
 * use is a technician at a bench with a phone, not someone picking files.
 */

type SessionInfo = {
  id: string;
  provider: string;
  expiresAt: string;
};

type CapturedItem = {
  id: string;
  stage: string;
  stageLabel: string;
  mediaType: string;
  caption: string | null;
  createdAt: string;
};

const STAGE_LABELS: Record<string, string> = {
  received: "Device received",
  diagnosed: "Fault diagnosed",
  part_replaced: "Part replaced",
  tested: "Tested",
  closed: "Reassembled and closed",
};

type RepairLiveCaptureProps = {
  bookingId: string;
  bookingLabel?: string;
};

export function RepairLiveCapture({ bookingId, bookingLabel }: RepairLiveCaptureProps) {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [items, setItems] = useState<CapturedItem[]>([]);
  const [stages, setStages] = useState<string[]>(Object.keys(STAGE_LABELS));
  const [stage, setStage] = useState("received");
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState<"open" | "close" | "upload" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`/api/repair-stream?bookingId=${encodeURIComponent(bookingId)}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        setLoaded(true);
        return;
      }

      const { data } = await response.json();
      setSession(data.session ?? null);
      setItems(Array.isArray(data.media) ? data.media : []);
      if (Array.isArray(data.stages) && data.stages.length > 0) setStages(data.stages);
    } catch {
      // Leave the panel as-is; the technician can retry.
    } finally {
      setLoaded(true);
    }
  }, [bookingId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function post(body: Record<string, unknown>) {
    const response = await fetch("/api/repair-stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(payload?.error?.message || "Request failed");
    return payload?.data;
  }

  async function handleOpen() {
    setBusy("open");
    setMessage(null);
    try {
      const data = await post({ action: "open", bookingId, provider: "stage-media" });
      setMessage(data?.reused ? "Live view was already on." : "Live view is on. The customer can watch now.");
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not start the live view.");
    } finally {
      setBusy(null);
    }
  }

  async function handleClose() {
    if (!session) return;
    setBusy("close");
    setMessage(null);
    try {
      await post({ action: "close", sessionId: session.id });
      setMessage("Live view ended. The customer can no longer watch.");
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not end the live view.");
    } finally {
      setBusy(null);
    }
  }

  async function handleCapture(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset immediately so picking the same file twice still fires a change event.
    event.target.value = "";
    if (!file || !session) return;

    setBusy("upload");
    setMessage(null);

    try {
      const form = new FormData();
      form.set("sessionId", session.id);
      form.set("stage", stage);
      form.set("caption", caption);
      form.set("file", file);

      const response = await fetch("/api/repair-stream", { method: "POST", body: form });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error?.message || "Upload failed");

      setCaption("");
      setMessage("Sent to the customer.");
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setBusy(null);
    }
  }

  if (!loaded) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading live view&hellip;
      </div>
    );
  }

  const isLive = Boolean(session);

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Camera className="size-4 text-primary" aria-hidden="true" />
            Watch-my-repair
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {isLive
              ? `The customer can watch ${bookingLabel ? `${bookingLabel} ` : ""}until ${new Date(session!.expiresAt).toLocaleString("en-IN")}.`
              : "Turn this on to let the customer follow the repair as you work."}
          </p>
        </div>

        {isLive ? (
          <button
            type="button"
            onClick={handleClose}
            disabled={busy !== null}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-60"
          >
            {busy === "close" ? <Loader2 className="size-3.5 animate-spin" /> : <StopCircle className="size-3.5" />}
            End live view
          </button>
        ) : (
          <button
            type="button"
            onClick={handleOpen}
            disabled={busy !== null}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {busy === "open" ? <Loader2 className="size-3.5 animate-spin" /> : <PlayCircle className="size-3.5" />}
            Start live view
          </button>
        )}
      </div>

      {isLive ? (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[auto_1fr]">
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                Stage
              </span>
              <select
                value={stage}
                onChange={(event) => setStage(event.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                {stages.map((value) => (
                  <option key={value} value={value}>
                    {STAGE_LABELS[value] ?? value}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                Note for the customer (optional)
              </span>
              <input
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                maxLength={140}
                placeholder="e.g. Old display removed, connector was corroded"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
              />
            </label>
          </div>

          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
            capture="environment"
            onChange={handleCapture}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={busy !== null}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-sm font-bold text-primary transition-colors hover:bg-primary/10 disabled:opacity-60"
          >
            {busy === "upload" ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            {busy === "upload" ? "Sending..." : "Take a photo or short clip"}
          </button>

          {items.length > 0 ? (
            <ul className="space-y-1.5">
              {items.map((item) => (
                <li key={item.id} className="flex items-start gap-2 rounded-xl bg-secondary/50 px-3 py-2">
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground">
                      {item.stageLabel}
                      <span className="ml-1.5 font-medium text-muted-foreground">
                        {new Date(item.createdAt).toLocaleTimeString("en-IN", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </p>
                    {item.caption ? <p className="text-xs text-muted-foreground">{item.caption}</p> : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">Nothing sent yet.</p>
          )}
        </div>
      ) : null}

      {message ? <p className="mt-3 text-xs font-semibold text-foreground">{message}</p> : null}
    </section>
  );
}
