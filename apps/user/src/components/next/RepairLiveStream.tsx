"use client";

import {
  CheckCircle2,
  Loader2,
  Lock,
  Maximize2,
  Minimize2,
  PictureInPicture2,
  RefreshCw,
  Shield,
  ShieldCheck,
  VideoOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * Live CCTV camera player for the `hls` provider.
 *
 * Plays the secure proxied playlist from /api/repair-stream/[bookingId]/hls.
 * Safari / iOS plays native HLS; Chrome/Firefox/Edge loads hls.js dynamically.
 *
 * Privacy & Security:
 * - Requires verified customer relationship (phone or user session).
 * - Requires explicit DPDP consent gate per session.
 * - Upstream RTSP camera IPs and ports are never exposed to the client.
 */

type RepairLiveStreamProps = {
  bookingId: string;
  phone: string;
  grant: string;
  consentGiven: boolean;
  onConsent: () => Promise<void>;
  benchLabel?: string | null;
};

export function RepairLiveStream({
  bookingId,
  phone,
  grant,
  consentGiven,
  onConsent,
  benchLabel,
}: RepairLiveStreamProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [ended, setEnded] = useState(false);
  const [consenting, setConsenting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const playlistUrl = `/api/repair-stream/${bookingId}/hls?phone=${encodeURIComponent(phone)}&grant=${encodeURIComponent(grant)}`;

  useEffect(() => {
    if (!consentGiven) return;

    const video = videoRef.current;
    if (!video) return;

    let destroyed = false;
    let hls: { destroy: () => void } | null = null;
    setLoading(true);
    setError(null);
    setEnded(false);

    async function attach() {
      // Safari / iOS plays HLS natively
      if (video!.canPlayType("application/vnd.apple.mpegurl")) {
        video!.src = playlistUrl;
        video!.onloadeddata = () => setLoading(false);
        video!.onerror = () => {
          if (!destroyed) {
            setEnded(true);
            setLoading(false);
          }
        };
        return;
      }

      try {
        const { default: Hls } = await import("hls.js");
        if (destroyed) return;

        if (!Hls.isSupported()) {
          setError("Live CCTV stream playback is not supported in this browser.");
          setLoading(false);
          return;
        }

        const instance = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          maxBufferLength: 6,
          maxMaxBufferLength: 12,
        });
        hls = instance;

        instance.loadSource(playlistUrl);
        instance.attachMedia(video!);

        instance.on(Hls.Events.MANIFEST_PARSED, () => {
          if (!destroyed) setLoading(false);
          video?.play().catch(() => {
            // Autoplay with sound may be blocked by browser; ensure muted
            if (video) video.muted = true;
          });
        });

        instance.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            setLoading(false);
            if (data.response?.code === 404) {
              setEnded(true);
            } else {
              setError("The live workbench CCTV feed has stopped or concluded.");
            }
          }
        });
      } catch {
        setError("Could not initialize the live CCTV player.");
        setLoading(false);
      }
    }

    void attach();

    return () => {
      destroyed = true;
      hls?.destroy();
    };
  }, [consentGiven, playlistUrl, retryCount]);

  // Fullscreen change listener
  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  async function handleConsent() {
    setConsenting(true);
    try {
      await onConsent();
    } finally {
      setConsenting(false);
    }
  }

  function toggleMute() {
    if (!videoRef.current) return;
    const nextMuted = !videoRef.current.muted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  }

  async function toggleFullscreen() {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen?.().catch(() => {});
    } else {
      await document.exitFullscreen?.().catch(() => {});
    }
  }

  async function togglePiP() {
    if (!videoRef.current) return;
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture?.().catch(() => {});
    } else if (document.pictureInPictureEnabled) {
      await videoRef.current.requestPictureInPicture?.().catch(() => {});
    }
  }

  // 1. Consent Gate (DPDP & Customer Agreement)
  if (!consentGiven) {
    return (
      <div className="overflow-hidden rounded-3xl border border-brand-200/80 bg-gradient-to-b from-brand-50/90 to-white p-6 shadow-sm sm:p-7">
        <div className="flex items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-100/80 text-brand-700">
            <ShieldCheck className="size-6" aria-hidden="true" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-100/80 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-brand-800">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Workbench Broadcast Available
            </div>
            <h3 className="mt-2 text-base font-bold text-gray-900 sm:text-lg">
              Watch Your Mobile Being Repaired Live
            </h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-gray-600">
              Our certified technician is servicing your device right now. You can watch the real-time CCTV stream
              of the shop workbench. This private video feed is encrypted, personal to your booking, and closes as
              soon as repair work concludes.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleConsent}
            disabled={consenting}
            className="inline-flex items-center gap-2 rounded-full gradient-brand px-5 py-2.5 text-[13px] font-bold text-white shadow-md shadow-brand-500/20 transition-all hover:opacity-95 hover:shadow-lg disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
          >
            {consenting ? <Loader2 className="size-4 animate-spin" /> : <Shield className="size-4" />}
            Agree &amp; Start Live Stream
          </button>
          <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
            <Lock className="size-3 text-gray-400" />
            Private 1-to-1 stream · Workbench view only
          </span>
        </div>
      </div>
    );
  }

  // 2. Session Ended View
  if (ended) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-emerald-100 bg-emerald-50/60 px-6 py-8 text-center sm:py-10">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="size-7" />
        </div>
        <h4 className="mt-3 text-sm font-bold text-emerald-950 sm:text-base">
          Live Repair Session Concluded
        </h4>
        <p className="mt-1 max-w-sm text-xs text-emerald-800/80">
          Work on your device has been completed on the workbench. Our team is finalizing testing and preparing your phone for return.
        </p>
      </div>
    );
  }

  // 3. Error Fallback View
  if (error) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <VideoOff className="size-4 shrink-0 text-gray-400" aria-hidden="true" />
          <p className="text-[12px] text-gray-600">{error}</p>
        </div>
        <button
          type="button"
          onClick={() => setRetryCount((c) => c + 1)}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <RefreshCw className="size-3" /> Retry
        </button>
      </div>
    );
  }

  // 4. Live Stream Player
  return (
    <div
      ref={containerRef}
      className="group relative overflow-hidden rounded-3xl border border-gray-800 bg-slate-950 shadow-2xl transition-all"
    >
      {/* Top Overlay Badge Bar */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between p-3.5 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600/90 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-sm backdrop-blur-md">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-80" />
              <span className="relative inline-flex size-2 rounded-full bg-white" />
            </span>
            Live Workshop CCTV
          </span>
          {benchLabel ? (
            <span className="hidden rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-medium text-white/90 backdrop-blur-md sm:inline-block">
              {benchLabel}
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-medium text-white/80 backdrop-blur-md">
          <Shield className="size-3 text-emerald-400" />
          <span>Personal &amp; Encrypted</span>
        </div>
      </div>

      {/* Loading Spinner */}
      {loading ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <Loader2 className="size-8 animate-spin text-brand-400" />
          <p className="mt-2 text-xs font-semibold text-white/80">
            Connecting to workshop CCTV camera...
          </p>
          <p className="mt-0.5 text-[11px] text-white/50">
            Low-latency encrypted feed
          </p>
        </div>
      ) : null}

      {/* HTML5 / HLS Video Element */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="aspect-video w-full object-contain bg-black"
        aria-label="Live CCTV stream of phone repair on workshop workbench"
      />

      {/* Bottom Custom Overlay Controls (Fades in on hover / active) */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-90 transition-opacity group-hover:opacity-100">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleMute}
            className="inline-flex size-8 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition-colors hover:bg-white/25 focus:outline-none"
            title={isMuted ? "Unmute audio" : "Mute audio"}
          >
            {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </button>
          <span className="text-[11px] text-white/70">
            {isMuted ? "Audio muted (bench visual feed)" : "Live Audio"}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setRetryCount((c) => c + 1)}
            className="inline-flex size-8 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition-colors hover:bg-white/25 focus:outline-none"
            title="Refresh stream"
          >
            <RefreshCw className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={togglePiP}
            className="inline-flex size-8 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition-colors hover:bg-white/25 focus:outline-none"
            title="Picture in Picture"
          >
            <PictureInPicture2 className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="inline-flex size-8 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition-colors hover:bg-white/25 focus:outline-none"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
