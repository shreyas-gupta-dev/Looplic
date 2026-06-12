"use client";

import { CalendarDays, CheckCircle2, Clock3, Laptop, Loader2, MapPin, Phone, User, Wrench, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { notifyLeadSubmission } from "@/src/lib/leads/client";
import { createClient } from "@/src/lib/data-client/client";
import { formatVisitingCharge, getVisitingChargePolicy } from "@/src/lib/visiting-charge";

const LAPTOP_ISSUES = [
  "Battery replacement",
  "Motherboard repair",
  "Not switching on",
  "Charging issue",
  "Keyboard replacement",
  "Screen replacement",
  "Hinge/body damage",
  "Slow performance",
  "SSD/RAM upgrade",
  "Data recovery",
] as const;

const TIME_SLOTS = ["8 AM - 11 AM", "11 AM - 2 PM", "2 PM - 5 PM", "5 PM - 8 PM"] as const;

const LAPTOP_BRANDS = [
  "Apple",
  "Dell",
  "HP",
  "Lenovo",
  "Asus",
  "Acer",
  "MSI",
  "Microsoft",
  "Samsung",
  "Razer",
  "Framework",
  "Alienware",
  "Toshiba",
  "Fujitsu",
  "LG",
  "Huawei",
  "Honor",
  "Realme",
  "Mi",
  "Avita",
  "Other",
] as const;

type LaptopBrandBookingPromptProps = {
  brandName?: string;
  initialOpen?: boolean;
  showFloatingButton?: boolean;
};

function isValidPhoneNumber(phone: string) {
  return phone.replace(/\D/g, "").length >= 10;
}

function getTodayDateString() {
  return new Date().toISOString().split("T")[0];
}

export function LaptopBrandBookingPrompt({ brandName = "", initialOpen = false, showFloatingButton = true }: LaptopBrandBookingPromptProps) {
  const dataClient = useMemo(() => createClient(), []);
  const [open, setOpen] = useState(initialOpen);
  const [step, setStep] = useState<"details" | "repair" | "schedule">("details");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [selectedBrand, setSelectedBrand] = useState(brandName);
  const [issue, setIssue] = useState<(typeof LAPTOP_ISSUES)[number] | "">("");
  const [details, setDetails] = useState("");
  const [scheduledDate, setScheduledDate] = useState(getTodayDateString());
  const [timeSlot, setTimeSlot] = useState<(typeof TIME_SLOTS)[number] | "">("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookedCode, setBookedCode] = useState("");
  const hasBrandChoices = !brandName;
  const currentBrandName = selectedBrand || brandName || "your";

  useEffect(() => {
    if (!initialOpen) {
      return;
    }
    const timer = window.setTimeout(() => setOpen(true), 350);
    return () => window.clearTimeout(timer);
  }, [initialOpen]);

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
        toast.success("Inspect location pinned.");
      },
      () => {
        setLocating(false);
        toast.error("Unable to detect location. Please allow location access.");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    );
  }

  function continueToRepair() {
    if (!name.trim()) {
      toast.error("Please add your name.");
      return;
    }
    if (!isValidPhoneNumber(phone)) {
      toast.error("Please add a valid phone number.");
      return;
    }
    if (!address.trim()) {
      toast.error("Please add your service location.");
      return;
    }
    setStep("repair");
  }

  function continueToSchedule() {
    if (!selectedBrand.trim()) {
      toast.error("Please select your laptop brand.");
      return;
    }
    if (!issue) {
      toast.error("Please select the laptop issue.");
      return;
    }
    setStep("schedule");
  }

  async function submitBooking() {
    if (!scheduledDate) {
      toast.error("Please select a preferred date.");
      return;
    }
    if (!timeSlot) {
      toast.error("Please select a preferred time slot.");
      return;
    }

    setSubmitting(true);

    const location = [address.trim(), city.trim()].filter(Boolean).join(", ");
    const visitingCharge = formatVisitingCharge("laptop_repair");
    const visitingChargePolicy = getVisitingChargePolicy("laptop_repair");
    const notes = [
      "Laptop repair quick booking",
      `Laptop brand: ${currentBrandName}`,
      `Issue: ${issue}`,
      `Preferred visit: ${scheduledDate} ${timeSlot}`,
      visitingChargePolicy,
      details.trim() ? `Customer note: ${details.trim()}` : "",
      latitude && longitude ? `Pinned location: ${latitude}, ${longitude}` : "",
    ].filter(Boolean).join("\n");

    const { data, error } = await dataClient
      .from("bookings")
      .insert({
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        model_id: null,
        location,
        pincode: pincode.trim() || null,
        service_type: "laptop_repair",
        status: "pending",
        scheduled_date: scheduledDate,
        time_slot: timeSlot,
        notes,
        inspect_latitude: latitude,
        inspect_longitude: longitude,
      } as any)
      .select("booking_code")
      .single();

    if (error) {
      toast.error(error.message || "Booking failed. Please try again.");
      setSubmitting(false);
      return;
    }

    await notifyLeadSubmission({
      source: "booking",
      title: `${currentBrandName} laptop repair quick booking`,
      customer: { name: name.trim(), phone: phone.trim() },
      service: { type: "laptop_repair", label: `${currentBrandName} Laptop Repair` },
      device: { brand: currentBrandName },
      schedule: { date: scheduledDate, timeSlot },
      bookingCode: (data as any)?.booking_code || "",
      address: location,
      city: city.trim(),
      pincode: pincode.trim(),
      notes,
      metadata: { brandName: currentBrandName, issue, latitude, longitude, visitingCharge },
    });

    setBookedCode((data as any)?.booking_code || "");
    toast.success("Laptop repair request booked.");
    setSubmitting(false);
  }

  if (!open && showFloatingButton) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-xs font-black text-primary-foreground shadow-elevated-brand"
      >
        <Wrench className="size-4" />
        Book laptop repair
      </button>
    );
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 px-2 pb-2 pt-10 sm:items-center sm:p-4">
      <div className="w-full max-w-[340px] overflow-hidden rounded-2xl border border-border bg-background shadow-elevated-brand sm:max-w-md">
        <div className="flex items-start justify-between gap-2 border-b border-border bg-secondary/45 p-2.5 sm:gap-3 sm:p-4">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-primary">Laptop booking</div>
            <h2 className="mt-0.5 text-sm font-black leading-tight text-foreground sm:mt-1 sm:text-lg">We are adding laptop models.</h2>
            <p className="mt-1 text-[10px] font-semibold leading-3 text-muted-foreground sm:text-xs sm:leading-5">
              Till then, book your laptop repair here and our team will confirm the exact model, visit time, and quote.
            </p>
          </div>
          <button type="button" onClick={() => setOpen(false)} className="inline-flex size-8 flex-shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground sm:size-9">
            <X className="size-4" />
          </button>
        </div>

        {bookedCode ? (
          <div className="p-5 text-center">
            <CheckCircle2 className="mx-auto size-12 text-emerald-600" />
            <h3 className="mt-3 text-xl font-black text-foreground">Booking received</h3>
            <p className="mt-2 text-sm font-semibold text-muted-foreground">
              {bookedCode ? `Order ${bookedCode} is now in admin orders.` : "Your order is now in admin orders."}
            </p>
            <button type="button" onClick={() => setOpen(false)} className="mt-5 w-full rounded-2xl bg-primary px-4 py-3 text-sm font-black text-primary-foreground">
              Done
            </button>
          </div>
        ) : (
          <div className="max-h-[68vh] space-y-2 overflow-y-auto p-2.5 sm:max-h-[76vh] sm:space-y-3 sm:p-4">
            <div className="grid grid-cols-3 gap-1 rounded-2xl bg-secondary/50 p-1">
              {(["details", "repair", "schedule"] as const).map((item) => (
                <button key={item} type="button" onClick={() => item === "details" ? setStep("details") : item === "repair" ? continueToRepair() : continueToSchedule()} className={`rounded-xl px-2 py-2 text-[11px] font-black capitalize ${step === item ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>
                  {item === "repair" ? "Brand" : item}
                </button>
              ))}
            </div>

            {step === "details" ? (
              <>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                  <label className="space-y-1.5">
                    <span className="text-xs font-black text-muted-foreground">Name</span>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <input value={name} onChange={(event) => setName(event.target.value)} className="h-10 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/30 sm:h-11 sm:rounded-2xl" placeholder="Customer name" />
                    </div>
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-xs font-black text-muted-foreground">Phone</span>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" className="h-10 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/30 sm:h-11 sm:rounded-2xl" placeholder="10 digit number" />
                    </div>
                  </label>
                </div>

                <label className="space-y-1.5">
                  <span className="text-xs font-black text-muted-foreground">Service location</span>
                  <textarea value={address} onChange={(event) => setAddress(event.target.value)} rows={2} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/30 sm:rounded-2xl sm:py-3" placeholder="House, street, landmark" />
                </label>

                <div className="grid grid-cols-[1fr_112px] gap-2">
                  <input value={city} onChange={(event) => setCity(event.target.value)} className="h-10 rounded-xl border border-border bg-background px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/30 sm:h-11 sm:rounded-2xl" placeholder="City" />
                  <input value={pincode} onChange={(event) => setPincode(event.target.value)} inputMode="numeric" maxLength={6} className="h-10 rounded-xl border border-border bg-background px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/30 sm:h-11 sm:rounded-2xl" placeholder="Pincode" />
                </div>

                <div className="rounded-xl border border-border bg-secondary/40 p-2.5 sm:rounded-2xl sm:p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-black text-foreground">{latitude && longitude ? "Location pinned" : "Pin current location"}</div>
                      <div className="mt-0.5 truncate text-[11px] font-bold text-muted-foreground">
                        {latitude && longitude ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` : "Helps technician navigate accurately"}
                      </div>
                    </div>
                    <button type="button" onClick={useCurrentLocation} disabled={locating} className="inline-flex items-center gap-1.5 rounded-xl bg-background px-3 py-2 text-xs font-black text-foreground disabled:opacity-60">
                      {locating ? <Loader2 className="size-3.5 animate-spin" /> : <MapPin className="size-3.5" />}
                      {locating ? "Detecting" : "Use current"}
                    </button>
                  </div>
                </div>

                <button type="button" onClick={continueToRepair} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-black text-primary-foreground sm:h-11 sm:rounded-2xl">
                  <Laptop className="size-4" />
                  Continue
                </button>
              </>
            ) : step === "repair" ? (
              <>
                <div className="rounded-xl bg-secondary/60 p-2.5 sm:rounded-2xl sm:p-3">
                  <div className="text-sm font-black text-foreground">{name || "Customer"}</div>
                  <div className="mt-1 text-xs font-semibold text-muted-foreground">{[city || address, pincode].filter(Boolean).join(" - ") || address || "Service location"}</div>
                </div>

                <label className="space-y-1.5">
                  <span className="text-xs font-black text-muted-foreground">Laptop brand</span>
                  {hasBrandChoices ? (
                    <div className="relative">
                      <Laptop className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <select value={selectedBrand} onChange={(event) => setSelectedBrand(event.target.value)} className="h-10 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/30 sm:h-11 sm:rounded-2xl">
                        <option value="">Select laptop brand</option>
                        {LAPTOP_BRANDS.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
                      </select>
                    </div>
                  ) : (
                    <input value={currentBrandName} readOnly className="h-10 w-full rounded-xl border border-border bg-secondary/50 px-3 text-sm font-black text-foreground sm:h-11 sm:rounded-2xl" />
                  )}
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs font-black text-muted-foreground">Issue</span>
                  <select value={issue} onChange={(event) => setIssue(event.target.value as typeof issue)} className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/30 sm:h-11 sm:rounded-2xl">
                    <option value="">Select issue</option>
                    {LAPTOP_ISSUES.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs font-black text-muted-foreground">More details</span>
                  <textarea value={details} onChange={(event) => setDetails(event.target.value)} rows={2} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/30 sm:rounded-2xl sm:py-2.5" placeholder="Example: no display, adapter light blinking" />
                </label>

                <button type="button" onClick={continueToSchedule} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-black text-primary-foreground sm:h-11 sm:rounded-2xl">
                  <CalendarDays className="size-4" />
                  Continue to schedule
                </button>
              </>
            ) : (
              <>
                <div className="rounded-xl bg-secondary/70 p-3 sm:rounded-2xl sm:p-4">
                  <div className="text-sm font-black text-foreground">{issue || "Laptop repair"}</div>
                  <div className="mt-1 text-sm font-semibold text-muted-foreground sm:mt-2">{currentBrandName} laptop</div>
                  <div className="mt-1 text-sm font-semibold text-muted-foreground sm:mt-2">{[city || address, pincode].filter(Boolean).join(" - ") || address || "Service location"}</div>
                </div>

                <label className="space-y-1.5">
                  <span className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">Service Date</span>
                  <div className="relative">
                    <input type="date" min={getTodayDateString()} value={scheduledDate} onChange={(event) => setScheduledDate(event.target.value)} className="h-11 w-full rounded-xl border border-border bg-secondary/40 px-4 pr-10 text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/30 sm:h-14 sm:rounded-2xl sm:px-5 sm:pr-12 sm:text-base" />
                    <CalendarDays className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-foreground" />
                  </div>
                </label>

                <div className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">Preferred Time Slot</span>
                  <div className="space-y-2">
                    {TIME_SLOTS.map((slot) => (
                      <button key={slot} type="button" onClick={() => setTimeSlot(slot)} className={`flex min-h-11 w-full items-center gap-2 rounded-xl border px-4 text-left text-sm font-black transition-all sm:min-h-14 sm:gap-3 sm:rounded-2xl sm:px-5 sm:text-base ${timeSlot === slot ? "border-[#0096FF] bg-blue-50 text-foreground shadow-sm" : "border-border bg-secondary/40 text-muted-foreground hover:border-[#0096FF]/40"}`}>
                        <Clock3 className="size-4 flex-shrink-0 sm:size-5" />
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] font-bold leading-4 text-amber-900 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-xs sm:leading-5">
                    Visiting charge: {formatVisitingCharge("laptop_repair")}. This visiting charge is waived once you claim the service from Looplic. If you do not claim the service, you have to pay the visiting charge.
                  </div>
                  <button type="button" onClick={submitBooking} disabled={submitting} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0096FF] to-[#00D28E] px-4 text-sm font-black text-white disabled:opacity-60 sm:h-14 sm:rounded-2xl">
                    {submitting ? <Loader2 className="size-4 animate-spin" /> : <Wrench className="size-4" />}
                    {submitting ? "Booking..." : "Confirm Booking"}
                  </button>
                  <button type="button" onClick={() => setStep("repair")} className="inline-flex h-10 w-full items-center justify-center rounded-2xl text-xs font-black text-muted-foreground">
                    Back to brand and issue
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
