"use client";

import {
  Camera,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  PlayCircle,
  Radio,
  StopCircle,
  Upload,
  Video,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Technician-side live view & CCTV workbench control panel.
 *
 * Supports two distinct modes:
 * 1. Live CCTV Stream (HLS) — real-time shop workbench camera feed of the device repair.
 * 2. Stage Media — photos/clips captured at each repair milestone.
 */

type SessionInfo = {
  id: string;
  provider: "hls" | "stage-media" | string;
  providerRef: string | null;
  expiresAt: string;
  consentGiven?: boolean;
};

type CentreOption = {
  key: string;
  label: string;
  isDefault?: boolean;
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
  const [centres, setCentres] = useState<CentreOption[]>([]);
  const [selectedCentre, setSelectedCentre] = useState<string>("");
  const [selectedProvider, setSelectedProvider] = useState<"hls" | "stage-media">("hls");
  const [stage, setStage] = useState("received");
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState<"open" | "close" | "upload" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [watchUrl, setWatchUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
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

      if (Array.isArray(data.centres) && data.centres.length > 0) {
        setCentres(data.centres);
        const defaultCentre = data.centres.find((c: CentreOption) => c.isDefault) ?? data.centres[0];
        if (defaultCentre && !selectedCentre) {
          setSelectedCentre(defaultCentre.key);
        }
      }

      if (data.session) {
        setSelectedProvider(data.session.provider === "hls" ? "hls" : "stage-media");
        if (data.session.providerRef) setSelectedCentre(data.session.providerRef);
      }
    } catch {
      // Keep panel functional for retry
    } finally {
      setLoaded(true);
    }
  }, [bookingId, selectedCentre]);

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

  async function handleOpen(providerOverride?: "hls" | "stage-media") {
    const provider = providerOverride ?? selectedProvider;
    setBusy("open");
    setMessage(null);
    try {
      const data = await post({
        action: "open",
        bookingId,
        provider,
        providerRef: provider === "hls" ? selectedCentre || null : null,
      });

      if (data?.watchUrl) {
        setWatchUrl(data.watchUrl);
      }

      setMessage(
        provider === "hls"
          ? "🔴 Live CCTV Stream is active. The customer can now watch workbench repair in real time."
          : "Live view milestone capture is active. Photos will appear on the customer's tracking page."
      );
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
      setMessage("Live stream session ended. Customer viewing has closed.");
      setWatchUrl(null);
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not end the live view.");
    } finally {
      setBusy(null);
    }
  }

  async function handleCapture(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
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
      setMessage("Photo milestone sent to customer.");
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setBusy(null);
    }
  }

  function handleCopyWatchUrl() {
    if (!watchUrl) return;
    navigator.clipboard.writeText(watchUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (!loaded) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading live view settings&hellip;
      </div>
    );
  }

  const isLive = Boolean(session);
  const isHls = session?.provider === "hls";

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-border/60">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
            {isHls ? (
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-red-600" />
              </span>
            ) : (
              <Camera className="size-4 text-primary" aria-hidden="true" />
            )}
            Shop CCTV &amp; Live Repair Stream
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {isLive
              ? `Customer personal stream active${bookingLabel ? ` for ${bookingLabel}` : ""} (${isHls ? "Real-time Workbench CCTV" : "Milestone Photos"}) until ${new Date(session!.expiresAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}.`
              : "Allow customer to watch their phone repair in real time via the workbench CCTV camera."}
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
            End Live Stream
          </button>
        ) : null}
      </div>

      {/* When NOT Live: Configuration & Initiation */}
      {!isLive ? (
        <div className="mt-4 space-y-4">
          {/* Mode Selector */}
          <div>
            <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Select Streaming Mode
            </span>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setSelectedProvider("hls")}
                className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                  selectedProvider === "hls"
                    ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                    : "border-border hover:bg-secondary/40 text-muted-foreground"
                }`}
              >
                <Video className={`mt-0.5 size-4 shrink-0 ${selectedProvider === "hls" ? "text-primary" : ""}`} />
                <div>
                  <div className="text-xs font-bold text-foreground">Real-Time CCTV Stream</div>
                  <div className="text-[11px] text-muted-foreground">
                    Continuous workbench camera video feed (HLS).
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedProvider("stage-media")}
                className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                  selectedProvider === "stage-media"
                    ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                    : "border-border hover:bg-secondary/40 text-muted-foreground"
                }`}
              >
                <Camera className={`mt-0.5 size-4 shrink-0 ${selectedProvider === "stage-media" ? "text-primary" : ""}`} />
                <div>
                  <div className="text-xs font-bold text-foreground">Milestone Photos / Clips</div>
                  <div className="text-[11px] text-muted-foreground">
                    Upload stage photos as repair progresses.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Workbench Camera Dropdown (for HLS) */}
          {selectedProvider === "hls" ? (
            <div className="rounded-xl border border-primary/20 bg-primary/[0.02] p-3.5 space-y-3">
              <label className="block">
                <span className="mb-1.5 flex items-center justify-between text-xs font-semibold text-foreground">
                  <span>Shop Workbench Camera</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-normal text-muted-foreground">
                    <Radio className="size-3 text-emerald-500" /> Active benches
                  </span>
                </span>
                <select
                  value={selectedCentre}
                  onChange={(e) => setSelectedCentre(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {centres.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label} {c.isDefault ? "(Default)" : ""}
                    </option>
                  ))}
                  {centres.length === 0 ? (
                    <option value="local-bench">Local Workbench (MediaMTX 127.0.0.1:8888)</option>
                  ) : null}
                </select>
              </label>

              <div className="text-[11px] text-muted-foreground">
                Camera feed is encrypted and gated. Upstream shop camera credentials are never exposed to the client.
              </div>
            </div>
          ) : null}

          {/* Start Button */}
          <button
            type="button"
            onClick={() => handleOpen()}
            disabled={busy !== null}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-sm transition-opacity hover:opacity-95 disabled:opacity-60"
          >
            {busy === "open" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <PlayCircle className="size-4" />
            )}
            {selectedProvider === "hls"
              ? "Start Live CCTV Stream"
              : "Start Milestone Photo Session"}
          </button>
        </div>
      ) : null}

      {/* When LIVE: Controls & Customer Link */}
      {isLive ? (
        <div className="mt-4 space-y-4">
          {/* Active Broadcast Card */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/50 p-3.5 text-emerald-950">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
                {isHls ? "CCTV Broadcast Active" : "Photo Session Active"}
              </span>
              <span className="text-[11px] font-medium text-emerald-700">
                Workbench: {session?.providerRef || "Primary"}
              </span>
            </div>

            {/* Customer Direct Watch Link */}
            {watchUrl ? (
              <div className="mt-3 rounded-lg border border-emerald-600/20 bg-white/90 p-2.5">
                <div className="text-[11px] font-semibold text-gray-700 mb-1">
                  Customer Personal Watch URL:
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    readOnly
                    value={watchUrl}
                    className="min-w-0 flex-1 rounded border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] text-gray-800 outline-none select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyWatchUrl}
                    title="Copy Link"
                    className="inline-flex items-center gap-1 rounded bg-gray-100 hover:bg-gray-200 px-2.5 py-1 text-[11px] font-semibold text-gray-700 transition-colors"
                  >
                    <Copy className="size-3" />
                    {copied ? "Copied" : "Copy"}
                  </button>
                  <a
                    href={watchUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 text-[11px] font-semibold transition-colors"
                  >
                    <ExternalLink className="size-3" /> View
                  </a>
                </div>
              </div>
            ) : null}
          </div>

          {/* If Stage Media is active, provide photo upload */}
          {!isHls ? (
            <div className="space-y-3">
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
                    Note for Customer (optional)
                  </span>
                  <input
                    value={caption}
                    onChange={(event) => setCaption(event.target.value)}
                    maxLength={140}
                    placeholder="e.g. Disassembled screen, testing connector"
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
                {busy === "upload" ? "Sending..." : "Take a Photo or Clip"}
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
                <p className="text-xs text-muted-foreground">Nothing captured yet.</p>
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      {message ? <p className="mt-3 text-xs font-semibold text-primary">{message}</p> : null}
    </section>
  );
}
