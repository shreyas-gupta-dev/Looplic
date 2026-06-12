"use client";

import { CalendarDays, Camera, Check, Clock3, Hash, Loader2, LogIn, MapPin, Phone, User } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { createClient } from "@/src/lib/data-client/client";
import { buildThankYouHref, trackGoogleAdsConversion } from "@/src/lib/gtag";
import { buildCctvBrandSelectionHref, getCctvServiceLabel, isCctvBrandValue, isCctvServiceValue } from "@/src/lib/cctv-booking";
import { downloadBookingConfirmationPdf } from "@/src/lib/invoice-pdf";
import { notifyLeadSubmission } from "@/src/lib/leads/client";
import { buildCustomerProfileInsert } from "@/src/lib/profile";
import { formatVisitingCharge, getVisitingChargePolicy } from "@/src/lib/visiting-charge";

const TIME_SLOTS = ["8 AM - 11 AM", "11 AM - 2 PM", "2 PM - 5 PM", "5 PM - 8 PM"] as const;

function getTodayDateString() {
  return new Date().toISOString().split("T")[0];
}

function isValidPhoneNumber(phone: string) {
  return phone.replace(/\D/g, "").length >= 10;
}

function isValidPincode(pincode: string) {
  return /^\d{6}$/.test(pincode.trim());
}

const SERVICE_LABELS: Record<string, string> = {
  "desktop-assembly": "Desktop Assembly",
  cctv: "CCTV Installation",
  "it-support": "IT Support",
  "managed-it-services": "Managed IT Services",
};

const SERVICE_TYPES: Record<string, string> = {
  "desktop-assembly": "desktop_assembly",
  cctv: "cctv",
  "it-support": "it_support",
  "managed-it-services": "managed_it_services",
};

const SERVICE_DESCRIPTIONS: Record<string, string> = {
  "desktop-assembly": "Custom PC build, wiring & component installation at your doorstep.",
  cctv: "CCTV camera installation, DVR/NVR setup, mobile viewing, network checks, and troubleshooting.",
  "it-support": "OS setup, software installation & network configuration service.",
  "managed-it-services": "Recurring business IT support, AMC contracts, network care, systems maintenance, and security basics.",
};

export function SimpleBookingFlowClient({ serviceSlug }: { serviceSlug: string }) {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [step, setStep] = useState<"details" | "schedule">("details");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(getTodayDateString());
  const [timeSlot, setTimeSlot] = useState<(typeof TIME_SLOTS)[number] | "">("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [booked, setBooked] = useState(false);
  const [bookedCode, setBookedCode] = useState("");

  const serviceLabel = SERVICE_LABELS[serviceSlug] || serviceSlug;
  const serviceType = SERVICE_TYPES[serviceSlug] || serviceSlug.replace(/-/g, "_");
  const serviceDescription = SERVICE_DESCRIPTIONS[serviceSlug] || "";
  const isCctv = serviceSlug === "cctv";
  const requestedCctvService = searchParams.get("cctv_service") || "";
  const requestedCctvBrand = searchParams.get("cctv_brand") || "";
  const selectedCctvService = isCctvServiceValue(requestedCctvService) ? requestedCctvService : "";
  const selectedCctvBrand = isCctvBrandValue(requestedCctvBrand) ? requestedCctvBrand : "";
  const selectedCctvServiceLabel = getCctvServiceLabel(selectedCctvService);
  const bookingPath = `/book/${serviceSlug}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  const hasSavedProfile =
    name.trim().length > 0 &&
    isValidPhoneNumber(phone) &&
    address.trim().length > 0 &&
    city.trim().length > 0 &&
    isValidPincode(pincode);

  useEffect(() => {
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    });
  }, [booked, step]);

  // Load auth user
  useEffect(() => {
    let ignore = false;
    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!ignore) {
        setUser(session?.user ?? null);
        setAuthLoading(false);
      }
    }
    loadUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!ignore) {
        setUser(session?.user ?? null);
        setAuthLoading(false);
      }
    });
    return () => { ignore = true; subscription.unsubscribe(); };
  }, [supabase.auth]);

  // Hydrate profile from DB
  useEffect(() => {
    let ignore = false;
    async function hydrateProfile() {
      if (!user || profileLoaded) return;
      try {
        const { data: profileData } = await supabase
          .from("customer_profiles")
          .select("full_name, phone, address, city, pincode, inspect_latitude, inspect_longitude")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!ignore && profileData) {
          setName((profileData as any).full_name || "");
          setPhone((profileData as any).phone || "");
          setAddress((profileData as any).address || "");
          setCity((profileData as any).city || "");
          setPincode((profileData as any).pincode || "");
          setLatitude((profileData as any).inspect_latitude ?? null);
          setLongitude((profileData as any).inspect_longitude ?? null);

          // If existing user has complete profile, skip to schedule
          const p = profileData as any;
          if (
            p.full_name?.trim() &&
            p.phone?.replace(/\D/g, "").length >= 10 &&
            p.address?.trim() &&
            p.city?.trim() &&
            /^\d{6}$/.test(p.pincode?.trim() || "")
          ) {
            setStep("schedule");
          }
        }
      } finally {
        if (!ignore) setProfileLoaded(true);
      }
    }
    hydrateProfile();
    return () => { ignore = true; };
  }, [user, profileLoaded, supabase]);

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      toast.error("Current location is not available on this device.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLocating(false);
        toast.success("Inspect location saved.");
      },
      () => {
        setLocating(false);
        toast.error("Unable to detect location. Please allow location access.");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    );
  }

  async function handleSaveDetails() {
    if (!user) {
      router.push(`/auth?redirect=${encodeURIComponent(bookingPath)}`);
      return;
    }
    if (!hasSavedProfile) {
      toast.error("Please fill in all required fields with a valid phone and 6-digit pincode.");
      return;
    }
    const { error } = await supabase.from("customer_profiles").upsert(
      buildCustomerProfileInsert({ userId: user.id, fullName: name, phone, address, city, pincode, inspectLatitude: latitude, inspectLongitude: longitude }) as any,
    );
    if (error) { toast.error(error.message); return; }
    toast.success("Details saved");
    setStep("schedule");
  }

  async function handleBook() {
    if (!user) {
      router.push(`/auth?redirect=${encodeURIComponent(bookingPath)}`);
      return;
    }
    if (!hasSavedProfile) { toast.error("Please complete your details first"); setStep("details"); return; }
    if (isCctv && !selectedCctvService) { toast.error("Please select a CCTV service"); setStep("details"); return; }
    if (isCctv && !selectedCctvBrand) { toast.error("Please select a CCTV brand"); setStep("details"); return; }
    if (!scheduledDate || !timeSlot) { toast.error("Please select a date and time slot"); return; }

    setSubmitting(true);

    // Upsert profile
    await supabase.from("customer_profiles").upsert(
      buildCustomerProfileInsert({ userId: user.id, fullName: name, phone, address, city, pincode, inspectLatitude: latitude, inspectLongitude: longitude }) as any,
    );

    // Insert booking - no model_id for these service types
    const location = [address.trim(), city.trim()].filter(Boolean).join(", ");
    const visitingCharge = formatVisitingCharge(serviceType);
    const visitingChargePolicy = getVisitingChargePolicy(serviceType);
    const bookingNotes = [
      selectedCctvServiceLabel ? `CCTV service: ${selectedCctvServiceLabel}` : "",
      selectedCctvBrand ? `CCTV brand: ${selectedCctvBrand}` : "",
      visitingChargePolicy,
      notes.trim(),
    ].filter(Boolean).join("\n\n") || null;
    const { data: bookingData, error } = await supabase
      .from("bookings")
      .insert({
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        model_id: null,
        location,
        pincode: pincode.trim(),
        scheduled_date: scheduledDate,
        time_slot: timeSlot,
        service_type: serviceType,
        user_id: user.id,
        notes: bookingNotes,
        cctv_service: selectedCctvService || null,
        cctv_brand: selectedCctvBrand || null,
        inspect_latitude: latitude,
        inspect_longitude: longitude,
      } as any)
      .select("booking_code")
      .single();

    if (error) {
      // Fallback: insert without booking_code select if column missing
      const { error: fallbackError } = await supabase.from("bookings").insert({
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        model_id: null,
        location,
        pincode: pincode.trim(),
        scheduled_date: scheduledDate,
        time_slot: timeSlot,
        service_type: serviceType,
        user_id: user.id,
        notes: bookingNotes,
        cctv_service: selectedCctvService || null,
        cctv_brand: selectedCctvBrand || null,
        inspect_latitude: latitude,
        inspect_longitude: longitude,
      } as any);
      if (fallbackError) { toast.error(fallbackError.message || "Booking failed"); setSubmitting(false); return; }
    }

    void notifyLeadSubmission({
      source: "booking",
      title: "New Looplic service booking",
      customer: { name, phone, email: user.email },
      service: {
        type: serviceType,
        label: selectedCctvServiceLabel ? `${serviceLabel} - ${selectedCctvServiceLabel}` : serviceLabel,
      },
      schedule: {
        date: scheduledDate,
        timeSlot,
      },
      bookingCode: (bookingData as any)?.booking_code || "",
      address,
      city,
      pincode,
      notes: bookingNotes,
      metadata: {
        flow: "SimpleBookingFlowClient",
        serviceSlug,
        cctvService: selectedCctvService,
        cctvBrand: selectedCctvBrand,
        latitude,
        longitude,
        visitingCharge,
      },
    });

    downloadBookingConfirmationPdf({
      bookingCode: (bookingData as any)?.booking_code || "",
      customerName: name,
      customerPhone: phone,
      serviceType,
      serviceLabel: selectedCctvServiceLabel ? `${serviceLabel} - ${selectedCctvServiceLabel}` : serviceLabel,
      scheduledDate,
      timeSlot,
      address,
      city,
      pincode,
      notes: bookingNotes,
    });

    toast.success("Booking confirmed!");
    const bookingCode = (bookingData as any)?.booking_code || "";
    trackGoogleAdsConversion("booking_form_submit", {
      lead_type: "booking",
      source: "simple_service_booking_form",
      booking_code: bookingCode,
      service_type: serviceType,
    });
    setBookedCode(bookingCode);
    setBooked(true);
    setSubmitting(false);
    router.push(buildThankYouHref({ type: "booking", source: "simple_service_booking_form", booking_code: bookingCode, service_type: serviceType }));
  }

  if (authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (isCctv && (!selectedCctvService || !selectedCctvBrand)) {
    return (
      <main className="container mx-auto max-w-md px-4 py-16">
        <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10">
            <Camera className="size-6 text-primary" />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Select CCTV brand first</h2>
          <p className="mb-5 text-sm text-muted-foreground">
            Choose your CCTV service and brand before continuing to the booking form.
          </p>
          <Link
            href={buildCctvBrandSelectionHref(selectedCctvService)}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#0096FF] to-[#00D28E] px-6 py-3 text-sm font-bold text-white"
          >
            Choose Brand
          </Link>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="container mx-auto max-w-lg px-4 py-16">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10">
            <LogIn className="size-6 text-primary" />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Login to book {serviceLabel}</h2>
          <p className="mb-5 text-sm text-muted-foreground">
            Sign in to save your details and schedule your service.
          </p>
          <Link
            href={`/auth?redirect=${encodeURIComponent(bookingPath)}`}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#0096FF] to-[#00D28E] px-6 py-3 text-sm font-bold text-white"
          >
            <LogIn className="size-4" /> Login or Create Account
          </Link>
        </div>
      </main>
    );
  }

  if (booked) {
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-gradient-to-r from-[#0096FF] to-[#00D28E]">
            <Check className="size-8 text-white" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-foreground">Booking Confirmed!</h2>
          {bookedCode ? <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">{bookedCode}</p> : null}
          <p className="mb-1 text-sm text-muted-foreground"><strong>{serviceLabel}</strong></p>
          <p className="mb-1 text-xs text-muted-foreground">{scheduledDate} | {timeSlot}</p>
          <p className="mb-6 text-xs text-muted-foreground">We&apos;ll contact you at <strong>{phone}</strong> to confirm your slot.</p>
          <Link href="/" className="inline-block rounded-2xl bg-gradient-to-r from-[#0096FF] to-[#00D28E] px-6 py-3 text-sm font-bold text-white">Back to Home</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container max-w-lg mx-auto py-10 px-4">
      {/* Service info strip */}
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-[#0096FF]/10 to-[#00D28E]/10 border border-[#0096FF]/20 p-4">
        <div className="text-sm font-bold text-foreground">{serviceLabel}</div>
        <div className="mt-1 text-xs text-muted-foreground">{serviceDescription}</div>
      </div>

      {/* Step indicator */}
      <div className="mb-6 flex items-center gap-3">
        <div className={`flex size-7 items-center justify-center rounded-full text-xs font-bold ${step === "details" ? "bg-gradient-to-r from-[#0096FF] to-[#00D28E] text-white" : "bg-emerald-100 text-emerald-700"}`}>
          {step === "schedule" ? <Check className="size-3.5" /> : "1"}
        </div>
        <div className="text-xs font-semibold text-muted-foreground">Your Details</div>
        <div className="h-px flex-1 bg-border" />
        <div className={`flex size-7 items-center justify-center rounded-full text-xs font-bold ${step === "schedule" ? "bg-gradient-to-r from-[#0096FF] to-[#00D28E] text-white" : "bg-secondary text-muted-foreground"}`}>2</div>
        <div className="text-xs font-semibold text-muted-foreground">Schedule</div>
      </div>

      {step === "details" && (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h1 className="mb-4 text-base font-semibold text-foreground">Your Details & Address</h1>
          <div className="space-y-3">
            <div className="relative">
              <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input type="tel" placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={15} className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-3.5 size-4 text-muted-foreground" />
              <textarea placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} rows={3} maxLength={200} className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div className="rounded-2xl border border-border bg-secondary/40 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">Inspect location</div>
                  <div className="mt-1 text-xs font-bold text-foreground">
                    {latitude && longitude ? `Pinned: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}` : "Use current location for accurate technician navigation."}
                  </div>
                </div>
                <button type="button" onClick={useCurrentLocation} disabled={locating} className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-black text-primary-foreground disabled:opacity-60">
                  {locating ? <Loader2 className="size-3.5 animate-spin" /> : <MapPin className="size-3.5" />}
                  {locating ? "Detecting" : "Use current"}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input type="text" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} maxLength={80} className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input type="text" placeholder="Pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} maxLength={6} className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
            </div>
            <div className="relative">
              <textarea placeholder="Notes / requirements (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={300} className="w-full rounded-xl border border-border bg-background py-3 px-4 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
          </div>
          <button type="button" onClick={handleSaveDetails} className="mt-4 w-full rounded-2xl bg-gradient-to-r from-[#0096FF] to-[#00D28E] py-3 text-sm font-bold text-white disabled:opacity-60">
            Save & Continue
          </button>
        </section>
      )}

      {step === "schedule" && (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-base font-semibold text-foreground">Choose Date & Time</h1>
            <button type="button" onClick={() => setStep("details")} className="text-xs font-semibold text-primary hover:underline">Edit details</button>
          </div>
          <div className="mb-4 rounded-2xl bg-secondary/60 p-3 text-sm">
            <div className="font-semibold text-foreground">{name}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{address}, {city} - {pincode}</div>
            {isCctv && (selectedCctvService || selectedCctvBrand) ? (
              <div className="mt-2 text-xs font-semibold text-primary">
                {[getCctvServiceLabel(selectedCctvService), selectedCctvBrand].filter(Boolean).join(" - ")}
              </div>
            ) : null}
          </div>
          <div className="space-y-4">
            <div>
              <label htmlFor="field-simplebookingflowclient-373" className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <CalendarDays className="inline size-3.5 mr-1" />Service Date
              </label>
              <input id="field-simplebookingflowclient-373" type="date" min={getTodayDateString()} value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div>
              <label htmlFor="field-simplebookingflowclient-379" className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Clock3 className="inline size-3.5 mr-1" />Preferred Time Slot
              </label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {TIME_SLOTS.map((slot) => (
                  <button key={slot} type="button" onClick={() => setTimeSlot(slot)} className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-left text-sm font-bold transition-all ${timeSlot === slot ? "border-[#0096FF] bg-blue-50 text-foreground" : "border-border bg-background text-muted-foreground hover:border-[#0096FF]/40"}`}>
                    <Clock3 className="size-4" />{slot}
                  </button>
                ))}
              </div>
            </div>
            {getVisitingChargePolicy(serviceType) ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold leading-5 text-amber-900">
                Visiting charge: {formatVisitingCharge(serviceType)}. This visiting charge is waived once you claim the service from Looplic. If you do not claim the service, you have to pay the visiting charge.
              </div>
            ) : null}
            <button type="button" onClick={handleBook} disabled={submitting || !scheduledDate || !timeSlot} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#0096FF] to-[#00D28E] py-3.5 text-sm font-extrabold text-white transition-transform active:scale-[0.98] disabled:opacity-60">
              {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
              {submitting ? "Booking..." : "Confirm Booking"}
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
