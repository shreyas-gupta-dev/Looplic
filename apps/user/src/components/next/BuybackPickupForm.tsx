"use client";

import { ArrowRight, CalendarCheck, CheckCircle, Hash, Loader2, LogIn, MapPin, MapPinned, Navigation, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { isValidPhoneNumber, isValidPincode, parseBookingLocation } from "@/src/lib/bookings";
import { createClient } from "@/src/lib/data-client/client";
import { trackGoogleAdsConversion } from "@/src/lib/gtag";
import { buildCustomerProfileInsert } from "@/src/lib/profile";
import { deviceDisplayName } from "@/src/lib/sell";

const TIME_SLOTS = ["10 AM – 1 PM", "1 PM – 4 PM", "4 PM – 7 PM"];

// Shared with UniversalBookingFlow so name/phone/address saved from a service
// booking pre-fill the sell/pickup form (and vice versa) on the same device.
const PROFILE_STORAGE_KEY_PREFIX = "looplic-booking-profile";
function profileStorageKey(userId: string) {
  return `${PROFILE_STORAGE_KEY_PREFIX}:${userId}`;
}

const DEFAULT_INSPECT_LOCATION = { lat: 13.034627, lng: 77.622726 };
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;

declare global {
  interface Window {
    google?: any;
    __looplicGoogleMapsLoading?: Promise<void>;
  }
}

// Postgres numeric columns come back from the RDS proxy as strings; coerce to a
// finite number (or null) before handing them to Google Maps, which throws on a
// string center.
function toFiniteCoord(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getStaticInspectMapUrl(position: { lat: number; lng: number }) {
  if (!GOOGLE_MAPS_API_KEY) return "";
  const params = new URLSearchParams({
    center: `${position.lat},${position.lng}`,
    zoom: "16", size: "640x320", scale: "2",
    maptype: "roadmap", key: GOOGLE_MAPS_API_KEY,
  });
  params.append("style", "feature:poi|visibility:off");
  params.append("style", "feature:transit|visibility:off");
  return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
}

type BuybackPickupFormProps = {
  /** "pickup" books a doorstep pickup for a quoted device; "quote" requests a manual quote for an unpriced model. */
  mode: "pickup" | "quote";
  brandName: string;
  modelName: string;
  variantLabel?: string | null;
  quoteAmount?: number | null;
  serviceType?: string;
  quoteBreakdown?: string | null;
};

export function BuybackPickupForm({ mode, brandName, modelName, variantLabel, quoteAmount, serviceType, quoteBreakdown }: BuybackPickupFormProps) {
  const dataClient = useMemo(() => createClient(), []);
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [bookingCode, setBookingCode] = useState<string | null>(null);

  // ─ Account + profile pre-fill (mirrors UniversalBookingFlow) ─
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);

  // ─ Map ─
  const isPickup = mode === "pickup";
  const [mapReady, setMapReady] = useState(false);
  const [pinEditable, setPinEditable] = useState(false);
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const googleMapRef = useRef<any>(null);
  const shouldCenterMapRef = useRef(true);
  const pinEditableRef = useRef(false);

  const device = `${deviceDisplayName(brandName, modelName)}${variantLabel ? ` (${variantLabel})` : ""}`;

  function getInspectPosition() {
    return {
      lat: toFiniteCoord(latitude) ?? DEFAULT_INSPECT_LOCATION.lat,
      lng: toFiniteCoord(longitude) ?? DEFAULT_INSPECT_LOCATION.lng,
    };
  }

  // ─ Auth ─
  useEffect(() => {
    let ignore = false;
    dataClient.auth.getSession().then(({ data: { session } }) => {
      if (!ignore) { setUser(session?.user ?? null); setAuthLoading(false); }
    });
    const { data: { subscription } } = dataClient.auth.onAuthStateChange((_event, session) => {
      if (!ignore) { setUser(session?.user ?? null); setAuthLoading(false); }
    });
    return () => { ignore = true; subscription.unsubscribe(); };
  }, [dataClient.auth]);

  // ─ Hydrate saved account details: localStorage → customer_profiles → last booking ─
  useEffect(() => {
    let ignore = false;
    async function hydrateProfile() {
      if (!user || profileLoaded) return;
      try {
        if (typeof window !== "undefined") localStorage.removeItem(PROFILE_STORAGE_KEY_PREFIX);
        const stored = typeof window !== "undefined" ? localStorage.getItem(profileStorageKey(user.id)) : null;
        if (stored && !ignore) {
          const p = JSON.parse(stored);
          setName((prev) => prev || p.customer_name || "");
          setPhone((prev) => prev || p.customer_phone || "");
          setAddress((prev) => prev || p.address || "");
          setCity((prev) => prev || p.city || "");
          setPincode((prev) => prev || p.pincode || "");
        }
        const { data: profileData } = await dataClient
          .from("customer_profiles")
          .select("full_name, phone, address, city, pincode, inspect_latitude, inspect_longitude")
          .eq("user_id", user.id)
          .maybeSingle();
        if (!ignore && profileData) {
          const p = profileData as any;
          setName(p.full_name || "");
          setPhone(p.phone || "");
          setAddress(p.address || "");
          setCity(p.city || "");
          setPincode(p.pincode || "");
          const lat = toFiniteCoord(p.inspect_latitude);
          const lng = toFiniteCoord(p.inspect_longitude);
          setLatitude(lat);
          setLongitude(lng);
          if (lat !== null && lng !== null) shouldCenterMapRef.current = true;
        } else if (!ignore) {
          const { data: lastBooking } = await dataClient
            .from("bookings")
            .select("customer_name, customer_phone, location, pincode, inspect_latitude, inspect_longitude")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (!ignore && lastBooking) {
            const b = lastBooking as any;
            const loc = parseBookingLocation(b.location);
            setName(b.customer_name || "");
            setPhone(b.customer_phone || "");
            setAddress(loc.address);
            setCity(loc.city);
            setPincode(b.pincode || "");
            const lat = toFiniteCoord(b.inspect_latitude);
            const lng = toFiniteCoord(b.inspect_longitude);
            setLatitude(lat);
            setLongitude(lng);
            if (lat !== null && lng !== null) shouldCenterMapRef.current = true;
          }
        }
      } finally {
        if (!ignore) setProfileLoaded(true);
      }
    }
    hydrateProfile();
    return () => { ignore = true; };
  }, [user, profileLoaded, dataClient]);

  // ─ Lazily load Google Maps for the pickup location picker ─
  useEffect(() => {
    if (!isPickup || !GOOGLE_MAPS_API_KEY || typeof window === "undefined") return;
    if (window.google?.maps) { setMapReady(true); return; }
    if (!window.__looplicGoogleMapsLoading) {
      window.__looplicGoogleMapsLoading = new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}&v=weekly`;
        script.async = true; script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Google Maps failed to load"));
        document.head.appendChild(script);
      });
    }
    window.__looplicGoogleMapsLoading
      .then(() => setMapReady(true))
      .catch(() => toast.error("Unable to load Google Maps."));
  }, [isPickup]);

  useEffect(() => {
    if (!mapReady || !mapElementRef.current || !window.google?.maps || googleMapRef.current) return;
    const position = getInspectPosition();
    googleMapRef.current = new window.google.maps.Map(mapElementRef.current, {
      center: position, zoom: 17, disableDefaultUI: true, zoomControl: false,
      draggable: pinEditable, gestureHandling: pinEditable ? "greedy" : "none",
      keyboardShortcuts: false, scrollwheel: pinEditable, disableDoubleClickZoom: !pinEditable,
      styles: [
        { featureType: "poi", stylers: [{ visibility: "off" }] },
        { featureType: "transit", stylers: [{ visibility: "off" }] },
      ],
    });
    const onDragStart = googleMapRef.current.addListener("dragstart", () => { shouldCenterMapRef.current = false; });
    const onIdle = googleMapRef.current.addListener("idle", () => {
      if (!pinEditableRef.current) return;
      const center = googleMapRef.current.getCenter();
      if (center) { setLatitude(center.lat()); setLongitude(center.lng()); }
    });
    return () => { onDragStart.remove(); onIdle.remove(); googleMapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady]);

  useEffect(() => { pinEditableRef.current = pinEditable; }, [pinEditable]);

  useEffect(() => {
    if (!mapReady || !googleMapRef.current) return;
    const position = getInspectPosition();
    googleMapRef.current.setOptions({
      draggable: pinEditable, gestureHandling: pinEditable ? "greedy" : "none",
      scrollwheel: pinEditable, disableDoubleClickZoom: !pinEditable,
    });
    if (shouldCenterMapRef.current) googleMapRef.current.panTo(position);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude, mapReady, pinEditable]);

  function fetchCurrentLocation() {
    if (!navigator.geolocation) { toast.error("Location not available on this device."); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setLocating(false);
        shouldCenterMapRef.current = true;
        googleMapRef.current?.setZoom(18);
        toast.success("Pickup location pinned.");
      },
      () => { setLocating(false); toast.error("Unable to detect location. Please allow location access."); },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    );
  }

  async function saveCustomerProfile() {
    // Only the pickup flow collects a full address; skip in quote mode so we
    // never overwrite a saved profile's address with blanks.
    if (!user || !isPickup) return;
    try {
      const payload = buildCustomerProfileInsert({
        userId: user.id, fullName: name, phone, address, city, pincode,
        inspectLatitude: latitude, inspectLongitude: longitude,
      });
      await dataClient.from("customer_profiles").upsert(payload as any, { onConflict: "user_id" });
    } catch {
      // Profile save is best-effort — never block the booking on it.
    }
    if (typeof window !== "undefined") {
      localStorage.setItem(profileStorageKey(user.id), JSON.stringify({
        customer_name: name.trim(), customer_phone: phone.trim(),
        address: address.trim(), city: city.trim(), pincode: pincode.trim(),
      }));
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;

    if (isPickup) {
      if (!isValidPhoneNumber(phone)) { toast.error("Please enter a valid phone number."); return; }
      if (!address.trim()) { toast.error("Please enter your pickup address."); return; }
      if (!city.trim()) { toast.error("Please enter your city."); return; }
      if (!isValidPincode(pincode)) { toast.error("Please enter a valid 6-digit pincode."); return; }
    }

    setStatus("submitting");

    // Keep the saved account details in sync so future service/sell bookings pre-fill.
    void saveCustomerProfile();

    // Fold city, pincode and a map link into the single address field the buyback
    // order stores/emails, so the pickup agent gets the full location.
    const composedAddress = (() => {
      if (!isPickup) return null;
      const base = [address.trim(), city.trim()].filter(Boolean).join(", ");
      const withPin = pincode.trim() ? `${base} – ${pincode.trim()}` : base;
      const lat = toFiniteCoord(latitude);
      const lng = toFiniteCoord(longitude);
      const mapLink = lat !== null && lng !== null ? ` (Map: https://maps.google.com/?q=${lat},${lng})` : "";
      return `${withPin}${mapLink}`.trim() || null;
    })();

    try {
      const response = await fetch("/api/buyback/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          brandName,
          modelName,
          variantLabel: variantLabel || null,
          quotedAmount: quoteAmount ?? null,
          quoteBreakdown: quoteBreakdown || null,
          serviceType: serviceType || "mobile",
          name: name.trim(),
          phone: phone.trim(),
          address: composedAddress,
          pickupDate: pickupDate || null,
          timeSlot: timeSlot || null,
        }),
      });
      const result = await response.json().catch(() => null);
      if (response.ok && result?.ok) {
        trackGoogleAdsConversion("sell_form_submit", {
          page_path: window.location.pathname,
          mode,
          service_type: serviceType || "mobile",
          brand: brandName,
          model: modelName,
          value: quoteAmount ?? undefined,
          currency: quoteAmount != null ? "INR" : undefined,
        });
        const code = typeof result.bookingCode === "string" ? result.bookingCode : null;
        if (isPickup && code) {
          router.push(`/sell/booked/${code}`);
          return;
        }
        setBookingCode(code);
        setStatus("done");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-6 text-center">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-white shadow-sm">
          <CheckCircle className="size-6 text-emerald-500" />
        </div>
        <h3 className="text-[16px] font-semibold text-gray-900">
          {isPickup ? "Pickup booked!" : "Quote request received!"}
        </h3>
        {bookingCode ? (
          <p className="mt-1 text-[13px] font-bold tracking-wide text-violet-600">Booking ID: {bookingCode}</p>
        ) : null}
        <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-gray-600">
          {isPickup
            ? `Our executive will call ${phone.trim() || "you"} to confirm the visit, verify your ${device} on the spot, and pay instantly via UPI or bank transfer.`
            : `We'll call ${phone.trim() || "you"} within a few hours with the best price for your ${device}.`}
        </p>
      </div>
    );
  }

  const inputClassName =
    "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-[13px] font-medium text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-violet-400";
  const staticInspectMapUrl = getStaticInspectMapUrl(getInspectPosition());

  // Pickup booking requires a signed-in account so the pickup is saved to the
  // user's profile and pre-fills from it — same gate as the service booking form.
  // The unpriced-model "quote" fallback stays open so we never lose that lead.
  if (isPickup) {
    if (authLoading) {
      return (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="size-5 animate-spin text-violet-500" />
        </div>
      );
    }
    if (!user) {
      const redirectTo = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/sell";
      return (
        <div className="rounded-2xl border border-violet-100 bg-violet-50/50 p-6 text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-white shadow-sm">
            <LogIn className="size-5 text-violet-600" />
          </div>
          <h3 className="text-[15px] font-semibold text-gray-900">Sign in to book your pickup</h3>
          <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-gray-600">
            Sign in or create an account to schedule your free pickup for the {device}. We&apos;ll pre-fill your saved
            details and keep this order in your account.
          </p>
          <a
            href={`/auth?redirect=${encodeURIComponent(redirectTo)}`}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#4F46E5] to-[#8B3DFF] px-6 py-3 text-[13px] font-bold text-white transition-all hover:opacity-90"
          >
            <LogIn className="size-4" /> Sign In or Create Account
          </a>
        </div>
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 text-left">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-500">Your name *</span>
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className={inputClassName} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-500">Phone *</span>
          <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98765 43210" className={inputClassName} />
        </label>
      </div>

      {isPickup ? (
        <>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-500">Pickup address *</span>
            <textarea
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              placeholder="House / street / area"
              className={`${inputClassName} resize-none`}
            />
          </label>

          {/* Pickup location map — same picker as the service booking form */}
          <div className="rounded-2xl border border-violet-200 bg-violet-50/40 p-3.5">
            <div className="mb-2.5 flex items-start justify-between gap-3">
              <span className="text-[13px] font-bold text-gray-900">Pickup Location</span>
              <div className="flex size-9 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                <MapPinned className="size-4" />
              </div>
            </div>
            <button
              type="button"
              onClick={fetchCurrentLocation}
              disabled={locating}
              className="mb-2.5 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-violet-300 bg-violet-50 px-4 py-2.5 text-[12px] font-bold text-gray-800 transition-colors hover:border-violet-400 hover:bg-violet-100/70 disabled:opacity-60"
            >
              {locating ? <Loader2 className="size-4 animate-spin text-violet-600" /> : <Navigation className="size-4 text-violet-600" />}
              {locating ? "Fetching current location" : "Fetch Current Location"}
            </button>
            <div className={`relative h-36 overflow-hidden rounded-2xl border border-gray-200 bg-slate-100 shadow-inner ${pinEditable ? "ring-2 ring-violet-300" : ""}`}>
              {!mapReady ? (
                staticInspectMapUrl ? (
                  <img src={staticInspectMapUrl} alt="Map preview" className="absolute inset-0 z-0 size-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
                ) : (
                  <div className="absolute inset-0 z-0 bg-[#eef3f7]">
                    <div className="absolute -left-10 top-16 h-9 w-[125%] -rotate-12 bg-slate-300/80" />
                    <div className="absolute -left-10 bottom-12 h-8 w-[125%] rotate-12 bg-slate-300/70" />
                  </div>
                )
              ) : null}
              <div ref={mapElementRef} className={`size-full ${mapReady ? "relative z-10" : "pointer-events-none absolute inset-0 z-0"}`} />
              <div className="pointer-events-none absolute left-1/2 top-1/2 z-30 flex -translate-x-1/2 -translate-y-full flex-col items-center">
                <div className={`flex size-9 items-center justify-center rounded-full border-4 border-white shadow-xl transition-colors ${pinEditable ? "bg-violet-600 text-white" : "bg-slate-900 text-white"}`}>
                  <MapPin className="size-5" />
                </div>
                <div className="h-3 w-0.5 bg-slate-900/70" />
              </div>
              {pinEditable ? (
                <div className="pointer-events-none absolute bottom-3 left-3 z-30 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-black text-violet-700 shadow-lg">
                  Move map to place pin
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => setPinEditable((v) => !v)}
                className={`absolute right-3 top-3 z-40 flex size-10 items-center justify-center rounded-full bg-white shadow-lg transition-colors ${pinEditable ? "text-violet-600 ring-2 ring-violet-200" : "text-violet-500 hover:text-violet-700"}`}
                title={pinEditable ? "Lock pin" : "Edit pin"}
              >
                <Pencil className="size-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-500">City *</span>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                <input required value={city} onChange={(e) => setCity(e.target.value)} placeholder="Bangalore" className={`${inputClassName} pl-9`} />
              </div>
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-500">Pincode *</span>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                <input required value={pincode} onChange={(e) => setPincode(e.target.value)} maxLength={6} placeholder="560001" className={`${inputClassName} pl-9`} />
              </div>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-500">Preferred date</span>
              <input
                type="date"
                value={pickupDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setPickupDate(e.target.value)}
                className={inputClassName}
              />
            </label>
            <div>
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-500">Time slot</span>
              <div className="flex flex-wrap gap-1.5">
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setTimeSlot(timeSlot === slot ? "" : slot)}
                    className={`rounded-full border px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                      timeSlot === slot ? "border-violet-500 bg-violet-50 text-violet-700" : "border-gray-200 bg-white text-gray-600 hover:border-violet-200"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : null}

      {status === "error" ? (
        <p className="text-[12px] font-semibold text-rose-500">
          Something went wrong — please try again in a moment.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#4F46E5] to-[#8B3DFF] px-6 py-3.5 text-[14px] font-bold text-white transition-all hover:opacity-90 disabled:opacity-60"
      >
        {status === "submitting" ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Sending...
          </>
        ) : isPickup ? (
          <>
            <CalendarCheck className="size-4" /> Confirm Free Pickup
          </>
        ) : (
          <>
            Request Best Price <ArrowRight className="size-4" />
          </>
        )}
      </button>
    </form>
  );
}
