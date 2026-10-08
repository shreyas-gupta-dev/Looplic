"use client";

import {
  AlertCircle,
  ArrowRight,
  Camera,
  CheckCircle2,
  Clock,
  Eye,
  Loader2,
  Maximize2,
  Minimize2,
  Monitor,
  PictureInPicture2,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Users,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Bench = {
  id: string;
  label: string;
  isDefault?: boolean;
};

type LiveData = {
  status: "online" | "break" | "offline";
  workingHours: string;
  location: string;
  activeBenches: Bench[];
  defaultBench: string;
  notice?: string;
};

export function LiveRepairClient() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [liveInfo, setLiveInfo] = useState<LiveData | null>(null);
  const [selectedBench, setSelectedBench] = useState<string>("bench-1");
  const [loading, setLoading] = useState(true);
  const [videoLoading, setVideoLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [streamError, setStreamError] = useState(false);
  const [viewerCount, setViewerCount] = useState(19);

  // Fast tracking input
  const [trackCode, setTrackCode] = useState("");
  const [trackPhone, setTrackPhone] = useState("");

  // Load centre information
  useEffect(() => {
    async function fetchCentres() {
      try {
        const res = await fetch("/api/live-camera/centres");
        if (res.ok) {
          const data: LiveData = await res.json();
          setLiveInfo(data);
          if (data.defaultBench) {
            setSelectedBench(data.defaultBench);
          }
        }
      } catch (err) {
        console.warn("Could not load centres:", err);
      } finally {
        setLoading(false);
      }
    }

    void fetchCentres();

    // Subtle random fluctuation for live viewer count (between 16 and 38)
    const interval = setInterval(() => {
      setViewerCount((prev) => Math.max(14, Math.min(42, prev + (Math.random() > 0.5 ? 1 : -1))));
    }, 9000);

    return () => clearInterval(interval);
  }, []);

  // Initialize and attach HLS stream
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let destroyed = false;
    let hls: { destroy: () => void } | null = null;
    const streamUrl = `/api/live-camera/stream?bench=${encodeURIComponent(selectedBench)}`;

    setVideoLoading(true);
    setStreamError(false);

    async function setupPlayer() {
      // Safari / iOS native HLS
      if (video!.canPlayType("application/vnd.apple.mpegurl")) {
        video!.src = streamUrl;
        video!.onloadeddata = () => {
          if (!destroyed) setVideoLoading(false);
        };
        video!.onerror = () => {
          if (!destroyed) {
            setStreamError(true);
            setVideoLoading(false);
          }
        };
        return;
      }

      // Chrome, Firefox, Edge: dynamic hls.js
      try {
        const { default: Hls } = await import("hls.js");
        if (destroyed) return;

        if (!Hls.isSupported()) {
          video!.src = streamUrl;
          return;
        }

        const instance = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          maxBufferLength: 8,
          maxMaxBufferLength: 16,
        });
        hls = instance;

        instance.loadSource(streamUrl);
        instance.attachMedia(video!);

        instance.on(Hls.Events.MANIFEST_PARSED, () => {
          if (!destroyed) setVideoLoading(false);
          video?.play().catch(() => {
            if (video) video.muted = true;
          });
        });

        instance.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal && !destroyed) {
            setVideoLoading(false);
            setStreamError(true);
          }
        });
      } catch (err) {
        console.warn("HLS player setup issue:", err);
      }
    }

    void setupPlayer();

    return () => {
      destroyed = true;
      if (hls) {
        hls.destroy();
      }
    };
  }, [selectedBench]);

  function toggleMute() {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  }

  async function toggleFullscreen() {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      try {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } catch {
        // Fullscreen request denied or not supported
      }
    } else {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch {
        // Exit fullscreen failed
      }
    }
  }

  async function togglePictureInPicture() {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch {
      // PiP not supported or rejected
    }
  }

  function handleTrackSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!trackCode.trim() || !trackPhone.trim()) return;
    router.push(`/track/${encodeURIComponent(trackCode.trim())}?phone=${encodeURIComponent(trackPhone.trim())}`);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-red-600 selection:text-white">
      {/* Glow highlight */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-red-950/20 via-slate-950/40 to-transparent" />

      <main className="relative container mx-auto max-w-6xl px-4 py-8 sm:py-12">
        {/* Top Breadcrumb & Live Banner */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex size-3">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-80" />
              <span className="relative inline-flex size-3 rounded-full bg-red-600" />
            </span>
            <span className="text-xs font-black uppercase tracking-widest text-red-500">
              Live CCTV Broadcast
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-xs font-medium text-slate-400">
              {liveInfo?.location || "Bengaluru Main Repair Hub"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1 text-xs font-semibold text-slate-300">
              <Users className="size-3.5 text-red-400" />
              <span>{viewerCount} Watching</span>
            </div>
            <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
              <ShieldCheck className="size-3.5" />
              <span>100% Genuine Parts Verified</span>
            </div>
          </div>
        </div>

        {/* Header Title & Subtitle */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            Watch Our Workshop Live
          </h1>
          <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
            No hidden doors. No fake parts. Experience real-time transparency where you can watch our master technicians repair smartphones, test OEM screens, and perform micro-soldering live.
          </p>
        </div>

        {/* Video Player Card */}
        <div
          ref={containerRef}
          className="group relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl transition-all"
        >
          {/* Video element */}
          <div className="relative aspect-video w-full bg-black">
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted={isMuted}
              className="size-full object-contain"
            />

            {/* Loading Spinner */}
            {videoLoading && !streamError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/70 backdrop-blur-sm">
                <Loader2 className="size-8 animate-spin text-red-500" />
                <p className="text-xs font-semibold tracking-wide text-slate-300">
                  Connecting to secure workshop camera feed&hellip;
                </p>
              </div>
            )}

            {/* Offline or Error State */}
            {streamError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/90 p-6 text-center">
                <VideoOff className="size-10 text-red-400" />
                <h3 className="text-base font-bold text-slate-100">Live Camera Stream Paused</h3>
                <p className="max-w-md text-xs text-slate-400">
                  {liveInfo?.notice ||
                    "Our technicians may be on a brief scheduled break, or the workbench is being sanitized. Please refresh in a moment."}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setStreamError(false);
                    setVideoLoading(true);
                    if (videoRef.current) videoRef.current.load();
                  }}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-xl gradient-brand px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90"
                >
                  <RefreshCw className="size-3.5" /> Reconnect Feed
                </button>
              </div>
            )}

            {/* Top HUD overlay */}
            <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 via-black/30 to-transparent pointer-events-none">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-md bg-red-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
                  <span className="size-1.5 rounded-full bg-white animate-pulse" />
                  REC ● LIVE
                </span>
                <span className="rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-300 backdrop-blur-sm">
                  1080P · 60 FPS
                </span>
              </div>

              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-300">
                <span className="hidden sm:inline bg-black/60 px-2.5 py-1 rounded-md backdrop-blur-sm">
                  {liveInfo?.location || "Bengaluru Center"}
                </span>
              </div>
            </div>

            {/* Bottom HUD overlay */}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-4 bg-gradient-to-t from-black/85 via-black/40 to-transparent">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-900/80 px-3 py-1.5 text-xs font-bold text-slate-200 backdrop-blur-md">
                  <Wrench className="size-3 text-red-400" />
                  {liveInfo?.activeBenches.find((b) => b.id === selectedBench)?.label || "Active Workbench"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleMute}
                  title={isMuted ? "Unmute stream audio" : "Mute audio"}
                  className="rounded-xl border border-slate-700 bg-slate-900/80 p-2 text-slate-200 backdrop-blur-md transition-colors hover:bg-slate-800 hover:text-white"
                >
                  {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                </button>

                <button
                  type="button"
                  onClick={togglePictureInPicture}
                  title="Picture in Picture (browse while watching)"
                  className="rounded-xl border border-slate-700 bg-slate-900/80 p-2 text-slate-200 backdrop-blur-md transition-colors hover:bg-slate-800 hover:text-white"
                >
                  <PictureInPicture2 className="size-4" />
                </button>

                <button
                  type="button"
                  onClick={toggleFullscreen}
                  title="Toggle Fullscreen"
                  className="rounded-xl border border-slate-700 bg-slate-900/80 p-2 text-slate-200 backdrop-blur-md transition-colors hover:bg-slate-800 hover:text-white"
                >
                  {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Workbench Selector Tabs */}
          <div className="border-t border-slate-800 bg-slate-900/90 p-3 sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Select Camera:
                </span>
                {(liveInfo?.activeBenches ?? [
                  { id: "bench-1", label: "Bench 1: Display Lab" },
                  { id: "bench-2", label: "Bench 2: Motherboard Diagnostics" },
                  { id: "bench-3", label: "Bench 3: Quality Testing" },
                ]).map((bench) => {
                  const active = selectedBench === bench.id;
                  return (
                    <button
                      key={bench.id}
                      type="button"
                      onClick={() => setSelectedBench(bench.id)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                        active
                          ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                          : "border border-slate-800 bg-slate-950/70 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                      }`}
                    >
                      <Camera className="size-3" />
                      {bench.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Clock className="size-3.5 text-slate-500" />
                <span>Operating Hours: <strong>10:00 AM &ndash; 8:30 PM IST</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Grid: Track Your Own Repair + Trust Cards */}
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {/* Col 1 & 2: 4 Trust Pillars */}
          <div className="lg:col-span-2 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red-500">
              <Sparkles className="size-3.5" />
              The Looplic Transparency Standard
            </div>
            <h2 className="mt-2 text-xl font-bold text-slate-100 sm:text-2xl">
              Why We Live-Stream Every Phone Repair
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-400">
              Mobile repair shouldn&apos;t happen behind opaque curtains. We broadcast our repair center so you know your device is treated with certified care.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-red-600/10 text-red-500">
                    <ShieldCheck className="size-4" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-200">Zero Part-Swapping Guarantee</h4>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">
                  Every original screw, sensor, and circuit remains intact. Camera recordings verify strict audit compliance for every device.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-500">
                    <CheckCircle2 className="size-4" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-200">100% Tested OEM Parts</h4>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">
                  We unbox and test screens, batteries, and camera modules under high magnification before installing them on your phone.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-blue-600/10 text-blue-500">
                    <Monitor className="size-4" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-200">ESD-Protected Clean Benches</h4>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">
                  Grounding mats, anti-static wrist straps, and precision heat-regulated separation stations prevent micro-component shock.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-amber-600/10 text-amber-500">
                    <Wrench className="size-4" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-200">Level-4 Certified Technicians</h4>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">
                  Our team averages 8+ years experience in iPhone OLED lamination, motherboard trace repair, and micro-soldering.
                </p>
              </div>
            </div>
          </div>

          {/* Col 3: Fast Track Your Own Device Card */}
          <div className="rounded-3xl border border-red-500/20 bg-gradient-to-b from-red-950/30 via-slate-900 to-slate-900 p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-600/20 px-3 py-1 text-xs font-bold text-red-400">
                <Eye className="size-3.5" />
                Track Your Device
              </div>
              <h3 className="mt-3 text-lg font-bold text-slate-100">
                Is your phone currently being repaired?
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                Enter your Booking ID and Phone number to switch to your assigned technician&apos;s dedicated camera view.
              </p>

              <form onSubmit={handleTrackSubmit} className="mt-5 space-y-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Booking ID
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MOB-123456-ABCD"
                    value={trackCode}
                    onChange={(e) => setTrackCode(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs font-medium text-slate-100 placeholder:text-slate-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 98765 43210"
                    value={trackPhone}
                    onChange={(e) => setTrackPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs font-medium text-slate-100 placeholder:text-slate-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>

                <button
                  type="submit"
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl gradient-brand py-3 text-xs font-bold text-white shadow-md shadow-red-600/20 hover:opacity-95 transition-opacity"
                >
                  Watch My Phone&apos;s Bench &rarr;
                </button>
              </form>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-800 text-center">
              <p className="text-xs text-slate-400">Need to book a repair first?</p>
              <Link
                href="/service/mobile-repair"
                className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-red-400 hover:text-red-300 transition-colors"
              >
                View Repair Pricing &amp; Book Doorstep Service &rarr;
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
