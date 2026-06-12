"use client";

import {
  CalendarDays, Check, ChevronLeft, ChevronRight, Clock3,
  Hash, Loader2, LogIn, MapPin, MapPinned, Navigation,
  Pencil, Phone, Shield, User, Wrench,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import {
  buildBookingInsert, isMissingBookingCodeColumnError, isValidPhoneNumber,
  isValidPincode, parseBookingLocation, type BookingInsert,
} from "@/src/lib/bookings";
import { buildThankYouHref, trackGoogleAdsConversion } from "@/src/lib/gtag";
import { downloadBookingConfirmationPdf } from "@/src/lib/invoice-pdf";
import { buildCustomerProfileInsert } from "@/src/lib/profile";
import { formatVisitingCharge, getVisitingChargePolicy } from "@/src/lib/visiting-charge";
import type {
  CatalogBrand, CatalogModel, CatalogSeries,
  ModelScreenGuard, RepairCategory, RepairSubcategory,
} from "@/src/lib/data/catalog";
import { notifyLeadSubmission } from "@/src/lib/leads/client";
import { createClient } from "@/src/lib/data-client/client";
import { RepairWarrantyTag } from "@/src/components/next/RepairWarrantyTag";
import {
  cctvBrandOptions, cctvServiceOptions, getCctvServiceLabel,
  isCctvBrandValue, isCctvServiceValue,
} from "@/src/lib/cctv-booking";

// ─── Global declarations ──────────────────────────────────────────────────────

declare global {
  interface Window {
    google?: any;
    __looplicGoogleMapsLoading?: Promise<void>;
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PROFILE_STORAGE_KEY = "looplic-booking-profile";
const TIME_SLOTS = ["8 AM - 11 AM", "11 AM - 2 PM", "2 PM - 5 PM", "5 PM - 8 PM"] as const;
const DEFAULT_INSPECT_LOCATION = { lat: 13.034627, lng: 77.622726 };
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;

const RAM_OPTIONS = ["4 GB", "8 GB", "16 GB", "32 GB", "64 GB"] as const;
const STORAGE_OPTIONS = ["HDD", "SSD", "NVMe SSD"] as const;
const OS_OPTIONS = ["Windows", "macOS", "Linux", "Other"] as const;
const CAMERA_COUNT_OPTIONS = ["1 – 2", "3 – 4", "5 – 8", "8+"] as const;
const LOCATION_TYPE_OPTIONS = ["Indoor only", "Outdoor only", "Indoor + Outdoor"] as const;
const DVR_OPTIONS = ["DVR (analog cameras)", "NVR (IP cameras)", "Not sure / Need advice"] as const;

const SCREEN_GUARD_BADGES: Record<string, string> = {
  "Privacy Guard": "Privacy", Privacy: "Privacy",
  "Matte Guard": "Matte", Matte: "Matte",
  "UV Glass": "UV", "Ceramic Guard": "Ceramic", "11D": "Shield",
};

const SERVICE_LABELS: Record<string, string> = {
  "mobile-repair": "Mobile Repair",
  "laptop-repair": "Laptop Repair",
  cctv: "CCTV Installation",
  "desktop-assembly": "Desktop Assembly",
  "it-support": "IT Support",
  "managed-it-services": "Managed IT Services",
  "wifi-network-installation": "WiFi Network Installation",
};

const DB_SERVICE_TYPES: Record<string, string> = {
  "desktop-assembly": "desktop_assembly",
  cctv: "cctv",
  "it-support": "it_support",
  "managed-it-services": "managed_it_services",
  "wifi-network-installation": "wifi_network_installation",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type FlowStep =
  | "service-select"
  | "repair-select"
  | "laptop-specs"
  | "cctv-config"
  | "notes"
  | "details"
  | "schedule";

export type UniversalBookingFlowProps = {
  serviceSlug: string;
  // Device flows (mobile-repair / laptop-repair)
  brand?: CatalogBrand;
  series?: CatalogSeries;
  model?: CatalogModel;
  basePath?: string;
  isRepair?: boolean;
  repairServiceType?: "mobile" | "laptop";
  guards?: ModelScreenGuard[];
  repairCategories?: RepairCategory[];
  repairSubcategories?: RepairSubcategory[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function displayGuardType(guardType: string) {
  const parts = guardType.split(" - ");
  return parts.length > 1 ? parts.slice(1).join(" - ") : guardType;
}

function getTodayDateString() {
  return new Date().toISOString().split("T")[0];
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
  params.append("style", "feature:road|element:geometry|color:cbd5e1");
  return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function UniversalBookingFlow({
  serviceSlug,
  brand, series, model,
  basePath,
  isRepair = false,
  repairServiceType,
  guards = [],
  repairCategories = [],
  repairSubcategories = [],
}: UniversalBookingFlowProps) {
  const supabase = useMemo(() => createClient(), []);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const isDeviceFlow = serviceSlug === "mobile-repair" || serviceSlug === "laptop-repair";
  const isCctv = serviceSlug === "cctv";
  const isSimple = !isDeviceFlow && !isCctv;
  const isLaptop = repairServiceType === "laptop";

  const serviceLabel = SERVICE_LABELS[serviceSlug] || serviceSlug;
  const dbServiceType: string = isDeviceFlow
    ? (isRepair ? `${repairServiceType}_repair` : "screen_guard")
    : (DB_SERVICE_TYPES[serviceSlug] || serviceSlug.replace(/-/g, "_"));

  // ─ Auth ─
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ─ Profile ─
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);

  // ─ Map ─
  const [mapReady, setMapReady] = useState(false);
  const [pinEditable, setPinEditable] = useState(false);
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const googleMapRef = useRef<any>(null);
  const shouldCenterMapRef = useRef(true);
  const pinEditableRef = useRef(false);

  // ─ Device selection ─
  const [selectedGuard, setSelectedGuard] = useState<ModelScreenGuard | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<RepairSubcategory | null>(null);
  const [optionSearch, setOptionSearch] = useState("");

  // ─ Laptop specs ─
  const [laptopRam, setLaptopRam] = useState("");
  const [laptopStorage, setLaptopStorage] = useState("");
  const [laptopOs, setLaptopOs] = useState("");

  // ─ CCTV config ─
  const requestedCctvService = searchParams.get("cctv_service") || "";
  const requestedCctvBrand = searchParams.get("cctv_brand") || "";
  const selectedCctvService = isCctvServiceValue(requestedCctvService) ? requestedCctvService : "";
  const selectedCctvBrand = isCctvBrandValue(requestedCctvBrand) ? requestedCctvBrand : "";
  const [cctvCameraCount, setCctvCameraCount] = useState("");
  const [cctvLocationType, setCctvLocationType] = useState("");
  const [cctvDvrPreference, setCctvDvrPreference] = useState("");

  // ─ Notes ─
  const [notes, setNotes] = useState("");

  // ─ Schedule ─
  const [scheduledDate, setScheduledDate] = useState(getTodayDateString());
  const [timeSlot, setTimeSlot] = useState<(typeof TIME_SLOTS)[number] | "">("");

  // ─ Submit ─
  const [submitting, setSubmitting] = useState(false);
  const [booked, setBooked] = useState(false);
  const [bookedCode, setBookedCode] = useState("");

  // ─ Step ─
  function getInitialStep(): FlowStep {
    if (isDeviceFlow) return "service-select";
    if (isCctv) return "cctv-config";
    return "notes";
  }
  const [currentStep, setCurrentStep] = useState<FlowStep>(getInitialStep);

  function goTo(step: FlowStep) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setCurrentStep(step);
    setOptionSearch("");
  }

  // ─ Derived state ─
  const selectedCategory = useMemo(
    () => repairCategories.find((c) => c.id === selectedCategoryId) ?? null,
    [repairCategories, selectedCategoryId],
  );
  const visibleSubcategories = useMemo(
    () => selectedCategoryId ? repairSubcategories.filter((s) => s.category_id === selectedCategoryId) : [],
    [repairSubcategories, selectedCategoryId],
  );
  const filteredGuards = useMemo(() => {
    const q = optionSearch.trim().toLowerCase();
    return q ? guards.filter((g) => displayGuardType(g.guard_type).toLowerCase().includes(q)) : guards;
  }, [guards, optionSearch]);
  const filteredCategories = useMemo(() => {
    const q = optionSearch.trim().toLowerCase();
    return q ? repairCategories.filter((c) => c.name.toLowerCase().includes(q)) : repairCategories;
  }, [repairCategories, optionSearch]);
  const filteredSubcategories = useMemo(() => {
    const q = optionSearch.trim().toLowerCase();
    return q ? visibleSubcategories.filter((s) => s.name.toLowerCase().includes(q)) : visibleSubcategories;
  }, [visibleSubcategories, optionSearch]);

  const selectedOption = isRepair ? selectedSubcategory : selectedGuard;
  const selectedLabel = isRepair
    ? selectedSubcategory?.name || ""
    : displayGuardType(selectedGuard?.guard_type || "");
  const selectedPrice = isRepair ? selectedSubcategory?.price : selectedGuard?.price;
  const selectedPriceVisible = !isRepair || selectedSubcategory?.price_visible !== false;

  const hasSavedProfile =
    name.trim().length > 0 &&
    isValidPhoneNumber(phone) &&
    address.trim().length > 0 &&
    city.trim().length > 0 &&
    isValidPincode(pincode);

  const visitingChargePolicy = getVisitingChargePolicy(dbServiceType);

  function getInspectPosition() {
    return { lat: latitude ?? DEFAULT_INSPECT_LOCATION.lat, lng: longitude ?? DEFAULT_INSPECT_LOCATION.lng };
  }

  function buildBookingNotes(): string {
    const parts: string[] = [];
    if (isLaptop && (laptopRam || laptopStorage || laptopOs)) {
      const specs = [
        laptopRam && `RAM: ${laptopRam}`,
        laptopStorage && `Storage: ${laptopStorage}`,
        laptopOs && `OS: ${laptopOs}`,
      ].filter(Boolean).join(", ");
      if (specs) parts.push(`Laptop specs: ${specs}`);
    }
    if (isCctv && (cctvCameraCount || cctvLocationType || cctvDvrPreference)) {
      const cctvParts = [
        cctvCameraCount && `Cameras: ${cctvCameraCount}`,
        cctvLocationType && `Location: ${cctvLocationType}`,
        cctvDvrPreference && `DVR/NVR: ${cctvDvrPreference}`,
      ].filter(Boolean).join(", ");
      if (cctvParts) parts.push(`CCTV config: ${cctvParts}`);
    }
    if (notes.trim()) parts.push(notes.trim());
    if (visitingChargePolicy) parts.push(visitingChargePolicy);
    return parts.filter(Boolean).join("\n\n");
  }

  function getPreviousStep(): FlowStep | null {
    if (currentStep === "service-select" || currentStep === "cctv-config" || currentStep === "notes") return null;
    if (currentStep === "repair-select") return "service-select";
    if (currentStep === "laptop-specs") return "repair-select";
    if (currentStep === "details") {
      if (isDeviceFlow) return isLaptop ? "laptop-specs" : (isRepair ? "repair-select" : "service-select");
      if (isCctv) return "cctv-config";
      return "notes";
    }
    if (currentStep === "schedule") return "details";
    return null;
  }

  // ─── Effects ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    let ignore = false;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!ignore) { setUser(session?.user ?? null); setAuthLoading(false); }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!ignore) { setUser(session?.user ?? null); setAuthLoading(false); }
    });
    return () => { ignore = true; subscription.unsubscribe(); };
  }, [supabase.auth]);

  useEffect(() => {
    let ignore = false;
    async function hydrateProfile() {
      if (!user || profileLoaded) return;
      try {
        // 1. localStorage (fast pre-fill)
        const stored = typeof window !== "undefined" ? localStorage.getItem(PROFILE_STORAGE_KEY) : null;
        if (stored && !ignore) {
          const p = JSON.parse(stored);
          setName(p.customer_name || "");
          setPhone(p.customer_phone || "");
          setAddress(p.address || "");
          setCity(p.city || "");
          setPincode(p.pincode || "");
        }
        // 2. Supabase customer_profiles (authoritative)
        const { data: profileData } = await supabase
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
          setLatitude(p.inspect_latitude ?? null);
          setLongitude(p.inspect_longitude ?? null);
          if (p.inspect_latitude && p.inspect_longitude) shouldCenterMapRef.current = true;
        } else if (!ignore) {
          // 3. Fall back to last booking
          const { data: lastBooking } = await supabase
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
            setLatitude(b.inspect_latitude ?? null);
            setLongitude(b.inspect_longitude ?? null);
            if (b.inspect_latitude && b.inspect_longitude) shouldCenterMapRef.current = true;
          }
        }
      } finally {
        if (!ignore) setProfileLoaded(true);
      }
    }
    hydrateProfile();
    return () => { ignore = true; };
  }, [user, profileLoaded, supabase]);

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY || typeof window === "undefined") return;
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
  }, []);

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

  // ─── Handlers ─────────────────────────────────────────────────────────────────

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
        toast.success("Inspect location pinned.");
      },
      () => { setLocating(false); toast.error("Unable to detect location. Please allow location access."); },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    );
  }

  async function saveCustomerProfile() {
    if (!user) return { error: null };
    const payload = buildCustomerProfileInsert({
      userId: user.id, fullName: name, phone, address, city, pincode,
      inspectLatitude: latitude, inspectLongitude: longitude,
    });
    return supabase.from("customer_profiles").upsert(payload as any, { onConflict: "user_id" }).select("user_id").single();
  }

  function persistProfileLocally() {
    if (typeof window === "undefined") return;
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify({
      customer_name: name.trim(), customer_phone: phone.trim(),
      address: address.trim(), city: city.trim(), pincode: pincode.trim(),
    }));
  }

  async function handleContinueFromDetails() {
    if (!user) {
      router.push(`/auth?redirect=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname + window.location.search : "/")}`);
      return;
    }
    if (!hasSavedProfile) {
      toast.error("Please fill in your name, phone, address, city, and a valid 6-digit pincode.");
      return;
    }
    const { error } = await saveCustomerProfile();
    if (error) { toast.error((error as any).message); return; }
    persistProfileLocally();
    toast.success("Details saved");
    goTo("schedule");
  }

  function handleContinueFromCctvConfig() {
    if (!cctvCameraCount) { toast.error("Please select the number of cameras."); return; }
    if (!cctvLocationType) { toast.error("Please select indoor or outdoor."); return; }
    if (!cctvDvrPreference) { toast.error("Please select a DVR/NVR preference."); return; }
    goTo("details");
  }

  function handleContinueFromLaptopSpecs() {
    if (!laptopRam) { toast.error("Please select RAM size."); return; }
    if (!laptopStorage) { toast.error("Please select storage type."); return; }
    if (!laptopOs) { toast.error("Please select operating system."); return; }
    goTo("details");
  }

  async function handleBook() {
    if (!user) {
      router.push(`/auth?redirect=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname + window.location.search : "/")}`);
      return;
    }
    if (!hasSavedProfile) { toast.error("Please complete your details first."); goTo("details"); return; }
    if (isDeviceFlow && isRepair && !selectedSubcategory) { toast.error("Please select a repair service."); return; }
    if (isDeviceFlow && !isRepair && !selectedGuard) { toast.error("Please select a screen guard."); return; }
    if (!scheduledDate || !timeSlot) { toast.error("Please select a date and time slot."); return; }

    setSubmitting(true);
    const bookingNotes = buildBookingNotes();
    const visitingCharge = formatVisitingCharge(dbServiceType);

    await saveCustomerProfile();
    persistProfileLocally();

    let bookingCode = "";
    let bookingError: any = null;

    if (isDeviceFlow && model) {
      const insertData = buildBookingInsert({
        customerName: name, customerPhone: phone, modelId: model.id,
        address, city, pincode, scheduledDate, timeSlot,
        serviceType: dbServiceType as any, userId: user.id,
        repairCategoryId: isRepair ? selectedCategoryId : null,
        repairSubcategoryId: isRepair ? selectedSubcategory?.id ?? null : null,
        guardType: !isRepair ? selectedGuard?.guard_type ?? null : null,
        inspectLatitude: latitude, inspectLongitude: longitude,
        notes: bookingNotes,
      });
      const result = await supabase.from("bookings").insert(insertData as any).select("booking_code").single();
      bookingCode = result.data?.booking_code || "";
      if (result.error && isMissingBookingCodeColumnError(result.error)) {
        const fallback = await supabase.from("bookings").insert(insertData as any);
        bookingError = fallback.error;
      } else {
        bookingError = result.error;
      }
    } else {
      const location = [address.trim(), city.trim()].filter(Boolean).join(", ");
      const payload = {
        customer_name: name.trim(), customer_phone: phone.trim(),
        model_id: null, location, pincode: pincode.trim(),
        scheduled_date: scheduledDate, time_slot: timeSlot,
        service_type: dbServiceType, user_id: user.id,
        notes: bookingNotes,
        cctv_service: isCctv ? (selectedCctvService || null) : null,
        cctv_brand: isCctv ? (selectedCctvBrand || null) : null,
        inspect_latitude: latitude, inspect_longitude: longitude,
      };
      const result = await supabase.from("bookings").insert(payload as any).select("booking_code").single();
      bookingCode = (result.data as any)?.booking_code || "";
      if (result.error && isMissingBookingCodeColumnError(result.error)) {
        const fallback = await supabase.from("bookings").insert(payload as any);
        bookingError = fallback.error;
      } else {
        bookingError = result.error;
      }
    }

    if (bookingError) {
      toast.error((bookingError as any).message || "Booking failed. Please try again.");
      setSubmitting(false);
      return;
    }

    const displayLabel = isDeviceFlow
      ? selectedLabel
      : isCctv
        ? [getCctvServiceLabel(selectedCctvService), selectedCctvBrand].filter(Boolean).join(" – ")
        : serviceLabel;

    void notifyLeadSubmission({
      source: "booking",
      title: "New Looplic booking",
      customer: { name, phone, email: user.email },
      service: { type: dbServiceType, label: displayLabel, price: isDeviceFlow ? selectedPrice : undefined },
      device: isDeviceFlow && brand && series && model
        ? { brand: brand.name, series: series.name, model: model.name }
        : undefined,
      schedule: { date: scheduledDate, timeSlot },
      bookingCode, address, city, pincode,
      notes: bookingNotes,
      metadata: {
        flow: "UniversalBookingFlow", serviceSlug,
        repairCategoryId: isRepair ? selectedCategoryId : undefined,
        repairSubcategoryId: isRepair ? selectedSubcategory?.id : undefined,
        guardType: (!isRepair && isDeviceFlow) ? selectedGuard?.guard_type : undefined,
        laptopRam: isLaptop ? laptopRam : undefined,
        laptopStorage: isLaptop ? laptopStorage : undefined,
        laptopOs: isLaptop ? laptopOs : undefined,
        cctvCameraCount: isCctv ? cctvCameraCount : undefined,
        cctvLocationType: isCctv ? cctvLocationType : undefined,
        cctvDvrPreference: isCctv ? cctvDvrPreference : undefined,
        latitude, longitude, visitingCharge,
      },
    });

    downloadBookingConfirmationPdf({
      bookingCode, customerName: name, customerPhone: phone,
      serviceType: dbServiceType, serviceLabel: displayLabel,
      price: isDeviceFlow ? selectedPrice : undefined,
      brand: brand?.name, series: series?.name, model: model?.name,
      scheduledDate, timeSlot, address, city, pincode, notes: bookingNotes,
    });

    trackGoogleAdsConversion("booking_form_submit", {
      lead_type: "booking", source: "universal_booking_flow",
      booking_code: bookingCode, service_type: dbServiceType,
      value: Number(isDeviceFlow ? selectedPrice ?? 0 : 0), currency: "INR",
    });

    toast.success("Booking confirmed!");
    setBookedCode(bookingCode);
    setBooked(true);
    setSubmitting(false);
    router.push(buildThankYouHref({
      type: "booking", source: "universal_booking_flow",
      booking_code: bookingCode, service_type: dbServiceType,
    }));
  }

  // ─── Early returns ────────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    const redirectTarget = encodeURIComponent(
      typeof window !== "undefined" ? window.location.pathname + window.location.search : "/"
    );
    return (
      <main className="container mx-auto max-w-lg px-4 py-16">
        <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10">
            <LogIn className="size-6 text-primary" />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Sign in to book {serviceLabel}</h2>
          <p className="mb-5 text-sm text-muted-foreground">
            Create an account or sign in to save your details and schedule your service.
          </p>
          <Link
            href={`/auth?redirect=${redirectTarget}`}
            className="inline-flex items-center gap-2 rounded-2xl gradient-brand px-6 py-3 text-sm font-bold text-primary-foreground"
          >
            <LogIn className="size-4" /> Sign In or Create Account
          </Link>
        </div>
      </main>
    );
  }

  if (booked) {
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full gradient-brand">
            <Check className="size-8 text-primary-foreground" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-foreground">Booking Confirmed!</h2>
          {bookedCode ? <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">{bookedCode}</p> : null}
          <p className="mb-1 text-sm text-muted-foreground">
            {isDeviceFlow
              ? <><strong>{selectedLabel}</strong> for {model?.name}</>
              : <strong>{serviceLabel}</strong>}
          </p>
          <p className="mb-1 text-xs text-muted-foreground">{scheduledDate} | {timeSlot}</p>
          <p className="mb-6 text-xs text-muted-foreground">
            We&apos;ll contact you at <strong>{phone}</strong> to confirm your slot.
          </p>
          <Link
            href={basePath || "/"}
            className="inline-block rounded-2xl gradient-brand px-6 py-3 text-sm font-bold text-primary-foreground"
          >
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  // ─── Main render ──────────────────────────────────────────────────────────────

  const prevStep = getPreviousStep();
  const staticInspectMapUrl = getStaticInspectMapUrl(getInspectPosition());

  return (
    <main className="flex-1">
      <div className="container py-6">

        {/* Breadcrumb — device flows only */}
        {isDeviceFlow && brand && series && model && (
          <div className="mb-5 flex flex-wrap items-center gap-1 text-xs font-semibold text-muted-foreground">
            <Link href={basePath || "/"} className="transition-colors hover:text-foreground">Home</Link>
            <ChevronRight className="size-3" />
            <Link href={`${basePath}/brands`} className="transition-colors hover:text-foreground">Brands</Link>
            <ChevronRight className="size-3" />
            <Link href={`${basePath}/brands/${brand.slug}`} className="transition-colors hover:text-foreground">{brand.name}</Link>
            <ChevronRight className="size-3" />
            <Link href={`${basePath}/brands/${brand.slug}/${series.slug}`} className="transition-colors hover:text-foreground">{series.name}</Link>
            <ChevronRight className="size-3" />
            <span className="text-foreground">{model.name}</span>
          </div>
        )}

        {/* Back button */}
        {prevStep ? (
          <button
            type="button"
            onClick={() => goTo(prevStep)}
            className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="size-3.5" /> Back
          </button>
        ) : null}

        {/* ── STEP: service-select ── */}
        {currentStep === "service-select" && isDeviceFlow && (
          <div>
            <h1 className="mb-1 text-xl font-semibold text-foreground">
              {isRepair ? "Choose Repair Category" : "Choose Screen Guard"}
            </h1>
            <p className="mb-5 text-xs text-muted-foreground">
              for <span className="font-bold text-foreground">{brand?.name} {model?.name}</span>
            </p>

            <div className="relative mb-5 max-w-sm">
              <input
                type="text"
                placeholder="Search..."
                value={optionSearch}
                onChange={(e) => setOptionSearch(e.target.value)}
                className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {isRepair ? (
              filteredCategories.length === 0 ? (
                <div className="py-16 text-center">
                  <Wrench className="mx-auto mb-3 size-10 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    {optionSearch ? "No categories match your search" : "No repair categories available"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {filteredCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => { setSelectedCategoryId(cat.id); setSelectedSubcategory(null); goTo("repair-select"); }}
                      className="flex flex-col items-center gap-2 rounded-2xl border-2 border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-card-brand"
                    >
                      {cat.image_url
                        ? <img src={cat.image_url} alt={cat.name} className="size-10 rounded-xl object-contain" />
                        : <div className="flex size-10 items-center justify-center rounded-xl bg-secondary"><Wrench className="size-5 text-primary" /></div>}
                      <span className="text-center text-xs font-bold text-foreground">{cat.name}</span>
                    </button>
                  ))}
                </div>
              )
            ) : (
              filteredGuards.length === 0 ? (
                <div className="py-16 text-center">
                  <Shield className="mx-auto mb-3 size-10 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    {optionSearch ? "No guards match your search" : "No screen guards available for this model"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredGuards.map((guard) => {
                    const label = displayGuardType(guard.guard_type);
                    return (
                      <button
                        key={guard.id}
                        onClick={() => { setSelectedGuard(guard); goTo("details"); }}
                        className="flex w-full items-center gap-3 rounded-2xl border-2 border-border bg-card p-4 text-left transition-all hover:border-primary/30 hover:shadow-card-brand"
                      >
                        {guard.image_url
                          ? <img src={guard.image_url} alt={label} className="size-11 rounded-2xl border border-border/70 bg-background object-contain p-1.5" />
                          : <div className="flex size-11 items-center justify-center rounded-2xl border border-border/70 bg-secondary text-sm font-bold text-primary">{SCREEN_GUARD_BADGES[label] || "Shield"}</div>}
                        <div className="flex-1"><span className="text-sm font-bold text-foreground">{label}</span></div>
                        <span className="text-lg font-extrabold gradient-brand-text">Rs. {guard.price}</span>
                      </button>
                    );
                  })}
                </div>
              )
            )}
          </div>
        )}

        {/* ── STEP: repair-select ── */}
        {currentStep === "repair-select" && isDeviceFlow && isRepair && (
          <div>
            <h1 className="mb-1 text-xl font-semibold text-foreground">Choose Repair Service</h1>
            <p className="mb-5 text-xs text-muted-foreground">
              for <span className="font-bold text-foreground">{brand?.name} {model?.name}</span>
            </p>

            <div className="relative mb-5 max-w-sm">
              <input
                type="text"
                placeholder="Search repair..."
                value={optionSearch}
                onChange={(e) => setOptionSearch(e.target.value)}
                className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="mb-4 rounded-2xl bg-secondary/60 p-4 text-sm text-foreground">
              <div className="font-bold">{selectedCategory?.name || "Repair Category"}</div>
              <div className="mt-1 text-xs text-muted-foreground">Choose the exact repair to continue</div>
            </div>

            {filteredSubcategories.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {optionSearch ? "No repairs match your search" : "No services available in this category"}
              </p>
            ) : (
              <div className="space-y-2.5">
                {filteredSubcategories.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => { setSelectedSubcategory(sub); goTo(isLaptop ? "laptop-specs" : "details"); }}
                    className="flex w-full items-center gap-3 rounded-3xl border border-border/80 bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card-brand"
                  >
                    {sub.image_url
                      ? <img src={sub.image_url} alt={sub.name} className="size-10 rounded-xl object-contain" />
                      : <div className="flex size-10 items-center justify-center rounded-xl bg-secondary"><Wrench className="size-5 text-muted-foreground" /></div>}
                    <div className="flex-1">
                      <span className="block text-sm font-bold text-foreground">{sub.name}</span>
                      <RepairWarrantyTag subcategoryName={sub.name} className="mt-2" />
                    </div>
                    {sub.price_visible !== false ? (
                      <div className="text-right">
                        <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Starts from</span>
                        <span className="text-lg font-semibold gradient-brand-text">Rs. {sub.price}</span>
                      </div>
                    ) : null}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STEP: laptop-specs ── */}
        {currentStep === "laptop-specs" && isLaptop && (
          <section className="rounded-2xl border border-border bg-card p-5 shadow-card-brand">
            <h1 className="mb-1 text-xl font-semibold text-foreground">Laptop Specifications</h1>
            <p className="mb-5 text-xs text-muted-foreground">
              Help us send the right technician with the correct parts
            </p>

            <div className="space-y-6">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">RAM Size</p>
                <div className="flex flex-wrap gap-2">
                  {RAM_OPTIONS.map((opt) => (
                    <button key={opt} type="button" onClick={() => setLaptopRam(opt)}
                      className={`rounded-xl border px-4 py-2 text-sm font-bold transition-all ${laptopRam === opt ? "border-primary bg-primary/5 text-foreground shadow-elevated-brand" : "border-border bg-background text-muted-foreground hover:border-primary/30"}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Storage Type</p>
                <div className="flex flex-wrap gap-2">
                  {STORAGE_OPTIONS.map((opt) => (
                    <button key={opt} type="button" onClick={() => setLaptopStorage(opt)}
                      className={`rounded-xl border px-4 py-2 text-sm font-bold transition-all ${laptopStorage === opt ? "border-primary bg-primary/5 text-foreground shadow-elevated-brand" : "border-border bg-background text-muted-foreground hover:border-primary/30"}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Operating System</p>
                <div className="flex flex-wrap gap-2">
                  {OS_OPTIONS.map((opt) => (
                    <button key={opt} type="button" onClick={() => setLaptopOs(opt)}
                      className={`rounded-xl border px-4 py-2 text-sm font-bold transition-all ${laptopOs === opt ? "border-primary bg-primary/5 text-foreground shadow-elevated-brand" : "border-border bg-background text-muted-foreground hover:border-primary/30"}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleContinueFromLaptopSpecs}
              className="mt-6 rounded-2xl gradient-brand px-5 py-3 text-sm font-bold text-primary-foreground"
            >
              Continue
            </button>
          </section>
        )}

        {/* ── STEP: cctv-config ── */}
        {currentStep === "cctv-config" && isCctv && (
          <section className="rounded-2xl border border-border bg-card p-5 shadow-card-brand">
            <h1 className="mb-1 text-xl font-semibold text-foreground">CCTV Requirements</h1>
            <p className="mb-5 text-xs text-muted-foreground">Help us understand your surveillance needs</p>

            {(selectedCctvService || selectedCctvBrand) && (
              <div className="mb-5 rounded-2xl bg-secondary/60 p-4 text-sm">
                {selectedCctvService && <div className="font-bold text-foreground">{getCctvServiceLabel(selectedCctvService)}</div>}
                {selectedCctvBrand && <div className="mt-1 text-muted-foreground">{selectedCctvBrand}</div>}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Number of Cameras</p>
                <div className="flex flex-wrap gap-2">
                  {CAMERA_COUNT_OPTIONS.map((opt) => (
                    <button key={opt} type="button" onClick={() => setCctvCameraCount(opt)}
                      className={`rounded-xl border px-4 py-2 text-sm font-bold transition-all ${cctvCameraCount === opt ? "border-primary bg-primary/5 text-foreground shadow-elevated-brand" : "border-border bg-background text-muted-foreground hover:border-primary/30"}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Installation Location</p>
                <div className="flex flex-wrap gap-2">
                  {LOCATION_TYPE_OPTIONS.map((opt) => (
                    <button key={opt} type="button" onClick={() => setCctvLocationType(opt)}
                      className={`rounded-xl border px-4 py-2 text-sm font-bold transition-all ${cctvLocationType === opt ? "border-primary bg-primary/5 text-foreground shadow-elevated-brand" : "border-border bg-background text-muted-foreground hover:border-primary/30"}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">DVR / NVR Preference</p>
                <div className="flex flex-col gap-2">
                  {DVR_OPTIONS.map((opt) => (
                    <button key={opt} type="button" onClick={() => setCctvDvrPreference(opt)}
                      className={`rounded-xl border px-4 py-3 text-left text-sm font-bold transition-all ${cctvDvrPreference === opt ? "border-primary bg-primary/5 text-foreground shadow-elevated-brand" : "border-border bg-background text-muted-foreground hover:border-primary/30"}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleContinueFromCctvConfig}
              className="mt-6 rounded-2xl gradient-brand px-5 py-3 text-sm font-bold text-primary-foreground"
            >
              Continue
            </button>
          </section>
        )}

        {/* ── STEP: notes ── */}
        {currentStep === "notes" && isSimple && (
          <section className="rounded-2xl border border-border bg-card p-5 shadow-card-brand">
            <h1 className="mb-1 text-xl font-semibold text-foreground">{serviceLabel}</h1>
            <p className="mb-5 text-xs text-muted-foreground">
              Add any notes or special requirements (optional)
            </p>
            <textarea
              placeholder="Describe your requirements, issues, or any helpful details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              maxLength={500}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              type="button"
              onClick={() => goTo("details")}
              className="mt-4 rounded-2xl gradient-brand px-5 py-3 text-sm font-bold text-primary-foreground"
            >
              Continue
            </button>
          </section>
        )}

        {/* ── STEP: details ── */}
        {currentStep === "details" && (
          <section className="rounded-2xl border border-border bg-card p-5 shadow-card-brand">
            <h1 className="mb-4 text-xl font-semibold text-foreground">Your Details &amp; Address</h1>

            {/* Service summary */}
            {isDeviceFlow && selectedOption && (
              <div className="mb-4 rounded-2xl bg-secondary/60 p-4 text-sm text-foreground">
                <div className="font-bold">{selectedLabel}</div>
                <div className="mt-1 text-muted-foreground">{brand?.name} {model?.name}</div>
                {isRepair ? <RepairWarrantyTag subcategoryName={selectedLabel} className="mt-2" /> : null}
                {selectedPriceVisible && selectedPrice
                  ? <div className="mt-2 font-extrabold text-primary">Rs. {selectedPrice}</div>
                  : null}
              </div>
            )}

            <div className="space-y-3">
              <div className="relative">
                <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100}
                  className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input type="tel" placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={15}
                  className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-3.5 size-4 text-muted-foreground" />
                <textarea placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} rows={2} maxLength={200}
                  className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>

              {/* Map pin */}
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50/30 p-4 shadow-sm">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold text-foreground">Inspect Location</h3>
                  <div className="flex size-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <MapPinned className="size-5" />
                  </div>
                </div>
                <button type="button" onClick={fetchCurrentLocation} disabled={locating}
                  className="mb-3 flex w-full items-center justify-center gap-2 rounded-3xl border border-dashed border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-black text-foreground transition-colors hover:border-emerald-400 hover:bg-emerald-100/70 disabled:opacity-60">
                  {locating ? <Loader2 className="size-4 animate-spin text-emerald-600" /> : <Navigation className="size-4 text-emerald-600" />}
                  {locating ? "Fetching current location" : "Fetch Current Location"}
                </button>
                <div className={`relative h-40 overflow-hidden rounded-3xl border border-border/70 bg-slate-100 shadow-inner ${pinEditable ? "ring-2 ring-emerald-300" : ""}`}>
                  {!mapReady ? (
                    staticInspectMapUrl
                      ? <img src={staticInspectMapUrl} alt="Map preview" className="absolute inset-0 z-0 size-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
                      : (
                        <div className="absolute inset-0 z-0 bg-[#eef3f7]">
                          <div className="absolute -left-10 top-16 h-9 w-[125%] -rotate-12 bg-slate-300/80" />
                          <div className="absolute -left-10 bottom-12 h-8 w-[125%] rotate-12 bg-slate-300/70" />
                          <div className="absolute left-1/3 -top-10 h-[140%] w-9 rotate-12 bg-slate-300/65" />
                        </div>
                      )
                  ) : null}
                  <div ref={mapElementRef} className={`size-full ${mapReady ? "relative z-10" : "pointer-events-none absolute inset-0 z-0"}`} />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-16 bg-gradient-to-t from-background/35 to-transparent" />
                  <div className="pointer-events-none absolute left-1/2 top-1/2 z-30 flex -translate-x-1/2 -translate-y-full flex-col items-center">
                    <div className={`flex size-9 items-center justify-center rounded-full border-4 border-white shadow-xl transition-colors ${pinEditable ? "bg-emerald-600 text-white" : "bg-slate-900 text-white"}`}>
                      <MapPin className="size-5" />
                    </div>
                    <div className="h-3 w-0.5 bg-slate-900/70" />
                  </div>
                  {pinEditable && (
                    <div className="pointer-events-none absolute bottom-3 left-3 z-30 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-black text-emerald-700 shadow-lg">
                      Move map to place pin
                    </div>
                  )}
                  <button type="button" onClick={() => setPinEditable((v) => !v)}
                    className={`absolute right-3 top-3 z-40 flex size-10 items-center justify-center rounded-full bg-card shadow-lg transition-colors ${pinEditable ? "text-primary ring-2 ring-primary/20" : "text-emerald-600 hover:text-primary"}`}
                    title={pinEditable ? "Lock pin" : "Edit pin"}>
                    <Pencil className="size-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} maxLength={80}
                    className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" placeholder="Pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} maxLength={6}
                    className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleContinueFromDetails}
              className="mt-4 rounded-2xl gradient-brand px-5 py-3 text-sm font-bold text-primary-foreground"
            >
              Save &amp; Continue
            </button>
          </section>
        )}

        {/* ── STEP: schedule ── */}
        {currentStep === "schedule" && (
          <section className="rounded-2xl border border-border bg-card p-5 shadow-card-brand">
            <h1 className="mb-4 text-xl font-semibold text-foreground">Choose Date &amp; Time</h1>

            {/* Summary */}
            <div className="mb-4 rounded-2xl bg-secondary/60 p-4 text-sm text-foreground">
              {isDeviceFlow ? (
                <>
                  <div className="font-bold">{selectedLabel}</div>
                  <div className="mt-1 text-muted-foreground">{brand?.name} {model?.name}</div>
                  {isRepair ? <RepairWarrantyTag subcategoryName={selectedLabel} className="mt-2" /> : null}
                  {selectedPriceVisible && selectedPrice
                    ? <div className="mt-2 font-extrabold text-primary">Rs. {selectedPrice}</div>
                    : null}
                </>
              ) : isCctv ? (
                <>
                  <div className="font-bold">{getCctvServiceLabel(selectedCctvService) || serviceLabel}</div>
                  {selectedCctvBrand && <div className="mt-1 text-muted-foreground">{selectedCctvBrand}</div>}
                  {cctvCameraCount && <div className="mt-1 text-xs text-muted-foreground">{cctvCameraCount} cameras · {cctvLocationType}</div>}
                </>
              ) : (
                <div className="font-bold">{serviceLabel}</div>
              )}
              <div className="mt-2 text-xs text-muted-foreground">{address}, {city} – {pincode}</div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <CalendarDays className="mr-1 inline size-3.5" />Service Date
                </label>
                <input
                  type="date"
                  min={getTodayDateString()}
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <Clock3 className="mr-1 inline size-3.5" />Preferred Time Slot
                </label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setTimeSlot(slot)}
                      className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-left text-sm font-bold transition-all ${timeSlot === slot ? "border-primary bg-primary/5 text-foreground shadow-elevated-brand" : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground"}`}
                    >
                      <Clock3 className="size-4" />{slot}
                    </button>
                  ))}
                </div>
              </div>

              {visitingChargePolicy ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold leading-5 text-amber-900">
                  Visiting charge: {formatVisitingCharge(dbServiceType)}. This visiting charge is waived once you claim the service from Looplic. If you do not claim the service, you have to pay the visiting charge.
                </div>
              ) : null}

              <button
                type="button"
                onClick={handleBook}
                disabled={submitting || !scheduledDate || !timeSlot}
                className="flex w-full items-center justify-center gap-2 rounded-2xl gradient-brand py-3.5 text-sm font-extrabold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
              >
                {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
                {submitting ? "Booking..." : "Confirm Booking"}
              </button>
            </div>
          </section>
        )}

      </div>
    </main>
  );
}
