"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { buildWhatsappLink } from "@/src/lib/whatsapp-links";

const popupSeenKey = "looplic-repair-popup-shown";

function shouldShowOnPath(pathname: string | null) {
  if (!pathname) return false;
  if (pathname === "/" || pathname === "/bangalore" || pathname === "/brand-pages" || pathname === "/service/cctv") return true;

  const segments = pathname.split("/").filter(Boolean);
  return segments[0] === "service" && segments[2] === "brands" && (segments.length === 3 || segments.length === 4);
}

export function RepairBookingPopup() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const showOnPath = shouldShowOnPath(pathname);
  const popupStorageKey = `${popupSeenKey}:${pathname || "unknown"}`;

  useEffect(() => {
    setOpen(false);

    if (!showOnPath) {
      return;
    }

    if (window.sessionStorage.getItem(popupStorageKey) === "true") {
      return;
    }

    const timeout = window.setTimeout(() => {
      window.sessionStorage.setItem(popupStorageKey, "true");
      setOpen(true);
    }, 3000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [pathname, popupStorageKey, showOnPath]);

  function closePopup() {
    setOpen(false);
  }

  if (!open || !showOnPath) {
    return null;
  }

  return (
    <div className="fixed inset-x-3 bottom-4 z-[80] mx-auto max-w-sm sm:bottom-6">
      <div className="overflow-hidden rounded-3xl border border-white/80 bg-white shadow-2xl shadow-slate-950/20 ring-1 ring-slate-900/5">
        <div className="relative h-32 overflow-hidden bg-slate-100 sm:h-36">
          <Image src="/looplic-cover-popup.webp" alt="Looplic doorstep tech care" fill sizes="384px" className="object-cover" priority={false} />
          <button
            type="button"
            onClick={closePopup}
            className="absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm transition-colors hover:bg-white hover:text-slate-950"
            aria-label="Close booking popup"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 ring-1 ring-emerald-100">
              <Image src="/whatsapp-popup.svg" alt="" width={24} height={24} className="size-7" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">Doorstep service</p>
              <h2 className="mt-1 text-xl font-black leading-tight text-slate-950">Book your repair</h2>
              <p className="mt-1 text-sm leading-5 text-slate-600">Mobile repair, laptop repair and tech support at your doorstep.</p>
            </div>
          </div>

          <a
            href={buildWhatsappLink({ service: "mobile_repair" })}
            target="_blank"
            rel="noreferrer"
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 text-sm font-black text-white shadow-lg shadow-emerald-500/25 transition-colors hover:bg-emerald-600"
          >
            <Image src="/whatsapp-popup.svg" alt="" width={20} height={20} className="size-6" aria-hidden="true" />
            Book on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
