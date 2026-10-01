"use client";

import { Camera, Loader2, RefreshCw, Video } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { RepairLiveStream } from "@/src/components/next/RepairLiveStream";

/**
 * "Watch my repair" — the customer's live view of work on their own device.
 *
 * Polls for a playback grant and the media captured so far, or renders the
 * real-time HLS workbench CCTV stream when an active camera session is open.
 *
 * Privacy & Security:
 * - Grants are short-lived HMAC tokens (TTL 2 minutes).
 * - Every denial fails closed to 404 to avoid leaking repair presence.
 */

const POLL_INTERVAL_MS = 8000;

type MediaItem = {
  id: string;
  stage: string;
  stageLabel: string;
  mediaType: string;
  caption: string | null;
  capturedByName: string | null;
  createdAt: string;
  url: string;
};

type RepairLiveViewProps = {
  bookingId: string;
  /** The phone the customer already proved they know to reach this page. */
  phone: string;
};

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
}

export function RepairLiveView({ bookingId, phone }: RepairLiveViewProps) {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [provider, setProvider] = useState<string>("stage-media");
  const [providerRef, setProviderRef] = useState<string | null>(null);
  const [grant, setGrant] = useState<string>("");
  const [consentGiven, setConsentGiven] = useState(false);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const cancelled = useRef(false);

  const load = useCallback(async () => {
    const query = `phone=${encodeURIComponent(phone)}`;

    try {
      // A grant is per-request: ask for a fresh one, and a 404 here means the
      // session has been closed or has expired.
      const grantResponse = await fetch(`/api/repair-stream/${bookingId}?${query}`, { cache: "no-store" });
      if (!grantResponse.ok) {
        if (!cancelled.current) {
          setAvailable(false);
          setItems([]);
        }
        return;
      }

      const grantData = await grantResponse.json();
      if (cancelled.current) return;

      const nextProvider = String(grantData.provider ?? "stage-media");
      setProvider(nextProvider);
      setProviderRef(grantData.providerRef ? String(grantData.providerRef) : null);
      setGrant(String(grantData.grant ?? ""));
      setConsentGiven(Boolean(grantData.consentGiven));
      setAvailable(true);
      setLastUpdated(new Date());

      // Only the stage-media provider has a media list to poll.
      if (nextProvider !== "stage-media") return;

      const mediaResponse = await fetch(
        `/api/repair-stream/${bookingId}/media?${query}&grant=${encodeURIComponent(grantData.grant)}`,
        { cache: "no-store" },
      );

      if (!mediaResponse.ok) {
        if (!cancelled.current) setAvailable(false);
        return;
      }

      const mediaData = await mediaResponse.json();
      if (cancelled.current) return;

      setItems(Array.isArray(mediaData.items) ? mediaData.items : []);
    } catch {
      // Keep what is on screen on brief network blips
      if (!cancelled.current && available === null) setAvailable(false);
    }
  }, [available, bookingId, phone]);

  const handleConsent = useCallback(async () => {
    try {
      const response = await fetch(`/api/repair-stream/${bookingId}/consent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      if (response.ok) {
        setConsentGiven(true);
        await load();
      }
    } catch {
      // Leave gate up for retry
    }
  }, [bookingId, load, phone]);

  useEffect(() => {
    cancelled.current = false;
    void load();

    const timer = setInterval(() => {
      void load();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled.current = true;
      clearInterval(timer);
    };
  }, [bookingId, phone, load]);

  async function handleManualRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  // Nothing open: render nothing rather than an empty placeholder.
  if (available !== true) return null;

  const isHls = provider === "hls";

  return (
    <section
      id="live-repair-view"
      className={`mt-6 rounded-3xl border bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6 transition-all ${
        isHls ? "border-red-200/80 ring-1 ring-red-100" : "border-gray-200"
      }`}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900 sm:text-base">
            <span className="relative flex size-2.5">
              <span
                className={`absolute inline-flex size-full animate-ping rounded-full opacity-75 ${
                  isHls ? "bg-red-400" : "bg-brand-400"
                }`}
              />
              <span
                className={`relative inline-flex size-2.5 rounded-full ${
                  isHls ? "bg-red-600" : "bg-brand-500"
                }`}
              />
            </span>
            {isHls ? "Live Workshop CCTV Stream" : "Watch your repair"}
          </h2>
          <p className="mt-1 text-[12px] text-gray-500">
            {isHls
              ? `Real-time CCTV camera feed from the repair workshop workbench while your device is being serviced.`
              : "Photos from our technician as each stage of your repair is completed."}
          </p>
        </div>

        <button
          type="button"
          onClick={handleManualRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-[12px] font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
        >
          {refreshing ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
          Refresh
        </button>
      </div>

      {isHls ? (
        <RepairLiveStream
          bookingId={bookingId}
          phone={phone}
          grant={grant}
          consentGiven={consentGiven}
          onConsent={handleConsent}
          benchLabel={providerRef}
        />
      ) : items.length === 0 ? (
        <p className="rounded-2xl bg-gray-50 px-4 py-6 text-center text-[13px] text-gray-500">
          Your technician has started. The first photos will appear here shortly.
        </p>
      ) : (
        <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item.id} className="overflow-hidden rounded-2xl border border-gray-200">
              <div className="relative aspect-video bg-gray-900">
                {item.mediaType === "video" ? (
                  <video
                    src={item.url}
                    controls
                    preload="metadata"
                    className="size-full object-contain"
                    aria-label={`${item.stageLabel} clip`}
                  />
                ) : (
                  <img
                    src={item.url}
                    alt={item.caption ?? item.stageLabel}
                    loading="lazy"
                    className="size-full object-contain"
                  />
                )}
                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  {item.mediaType === "video" ? (
                    <Video className="size-3" aria-hidden="true" />
                  ) : (
                    <Camera className="size-3" aria-hidden="true" />
                  )}
                  {item.stageLabel}
                </span>
              </div>
              <div className="px-3 py-2">
                {item.caption ? <p className="text-[12px] text-gray-700">{item.caption}</p> : null}
                <p className="mt-0.5 text-[11px] text-gray-400">
                  {formatTime(item.createdAt)}
                  {item.capturedByName ? ` · ${item.capturedByName}` : ""}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}

      {lastUpdated ? (
        <p className="mt-3 text-right text-[11px] text-gray-400">
          Updated {formatTime(lastUpdated.toISOString())} · refreshes automatically
        </p>
      ) : null}
    </section>
  );
}
