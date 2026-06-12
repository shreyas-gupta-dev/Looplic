"use client";

import { CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, Hash, Loader2, LogIn, MapPin, MapPinned, Navigation, Pencil, Phone, Shield, User, Wrench } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { toast } from "sonner";

import { buildBookingInsert, isMissingBookingCodeColumnError, isValidPhoneNumber, isValidPincode, parseBookingLocation } from "@/src/lib/bookings";
import type { BookingInsert } from "@/src/lib/bookings";
import { buildThankYouHref, trackGoogleAdsConversion } from "@/src/lib/gtag";
import { downloadBookingConfirmationPdf } from "@/src/lib/invoice-pdf";
import { buildCustomerProfileInsert } from "@/src/lib/profile";
import { formatVisitingCharge, getVisitingChargePolicy } from "@/src/lib/visiting-charge";
import type {
  CatalogBrand,
  CatalogModel,
  CatalogSeries,
  ModelScreenGuard,
  RepairCategory,
  RepairSubcategory,
} from "@/src/lib/data/catalog";
import { notifyLeadSubmission } from "@/src/lib/leads/client";
import { createClient } from "@/src/lib/data-client/client";
import { RepairWarrantyTag } from "@/src/components/next/RepairWarrantyTag";

type BookingStepFlowProps = {
  brand: CatalogBrand;
  series: CatalogSeries;
  model: CatalogModel;
  basePath: string;
  isRepair: boolean;
  repairServiceType?: "mobile" | "laptop";
  guards: ModelScreenGuard[];
  repairCategories: RepairCategory[];
  repairSubcategories: RepairSubcategory[];
};

type FlowStep = "select" | "repair" | "details" | "schedule";

const TIME_SLOTS = ["8 AM - 11 AM", "11 AM - 2 PM", "2 PM - 5 PM", "5 PM - 8 PM"] as const;
const serviceBadges: Record<string, string> = {
  "Privacy Guard": "Privacy",
  Privacy: "Privacy",
  "Matte Guard": "Matte",
  Matte: "Matte",
  "UV Glass": "UV",
  "Ceramic Guard": "Ceramic",
  "11D": "Shield",
};

const DEFAULT_INSPECT_LOCATION = { lat: 13.034627, lng: 77.622726 };
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;

declare global {
  interface Window {
    google?: any;
    __looplicGoogleMapsLoading?: Promise<void>;
  }
}

function displayGuardType(guardType: string) {
  const parts = guardType.split(" - ");
  return parts.length > 1 ? parts.slice(1).join(" - ") : guardType;
}

function getTodayDateString() {
  return new Date().toISOString().split("T")[0];
}

function getInspectMapEmbedUrl(position: { lat: number; lng: number }) {
  const params = new URLSearchParams({
    q: `${position.lat},${position.lng}`,
    z: latitudeToZoom(position.lat),
    output: "embed",
  });

  return `https://www.google.com/maps?${params.toString()}`;
}

function latitudeToZoom(latitude: number) {
  return Math.abs(latitude - DEFAULT_INSPECT_LOCATION.lat) < 0.001 ? "12" : "17";
}

function attachMapListeners(
  map: any,
  pinEditableRef: MutableRefObject<boolean>,
  shouldCenterMapRef: MutableRefObject<boolean>,
  setLatitude: (value: number) => void,
  setLongitude: (value: number) => void,
) {
  const dragStartListener = map.addListener("dragstart", () => {
    shouldCenterMapRef.current = false;
  });
  const idleListener = map.addListener("idle", () => {
    if (!pinEditableRef.current) return;
    const center = map.getCenter();
    if (!center) return;
    setLatitude(center.lat());
    setLongitude(center.lng());
  });

  return () => {
    dragStartListener.remove();
    idleListener.remove();
  };
}

export function BookingStepFlow({
  brand,
  series,
  model,
  basePath,
  isRepair,
  repairServiceType,
  guards,
  repairCategories,
  repairSubcategories,
}: BookingStepFlowProps) {
  const dataClient = createClient();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [pinEditable, setPinEditable] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(getTodayDateString());
  const [timeSlot, setTimeSlot] = useState<(typeof TIME_SLOTS)[number] | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [booked, setBooked] = useState(false);
  const [bookedCode, setBookedCode] = useState("");
  const [optionSearch, setOptionSearch] = useState("");

  const stepParam = searchParams.get("step");
  const selectedCategoryId = searchParams.get("category");
  const selectedRepairId = searchParams.get("repair");
  const selectedGuardId = searchParams.get("guard");
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const googleMapRef = useRef<any>(null);
  const shouldCenterMapRef = useRef(true);
  const pinEditableRef = useRef(false);

  const currentStep: FlowStep = (() => {
    if (stepParam === "repair" || stepParam === "details" || stepParam === "schedule") {
      return stepParam;
    }
    if (isRepair && selectedCategoryId) {
      return "repair";
    }
    return "select";
  })();

  const selectedGuard = useMemo(() => guards.find((guard) => guard.id === selectedGuardId) ?? null, [guards, selectedGuardId]);
  const selectedSubcategory = useMemo(
    () => repairSubcategories.find((subcategory) => subcategory.id === selectedRepairId) ?? null,
    [repairSubcategories, selectedRepairId],
  );
  const selectedCategory = useMemo(
    () => repairCategories.find((category) => category.id === selectedCategoryId) ?? null,
    [repairCategories, selectedCategoryId],
  );
  const visibleSubcategories = useMemo(
    () => (selectedCategoryId ? repairSubcategories.filter((subcategory) => subcategory.category_id === selectedCategoryId) : []),
    [repairSubcategories, selectedCategoryId],
  );
  const filteredGuards = useMemo(() => {
    const query = optionSearch.trim().toLowerCase();
    if (!query) {
      return guards;
    }

    return guards.filter((guard) => displayGuardType(guard.guard_type).toLowerCase().includes(query));
  }, [guards, optionSearch]);
  const filteredCategories = useMemo(() => {
    const query = optionSearch.trim().toLowerCase();
    if (!query) {
      return repairCategories;
    }

    return repairCategories.filter((category) => category.name.toLowerCase().includes(query));
  }, [optionSearch, repairCategories]);
  const filteredSubcategories = useMemo(() => {
    const query = optionSearch.trim().toLowerCase();
    if (!query) {
      return visibleSubcategories;
    }

    return visibleSubcategories.filter((subcategory) => subcategory.name.toLowerCase().includes(query));
  }, [optionSearch, visibleSubcategories]);

  const selectedOption = isRepair ? selectedSubcategory : selectedGuard;
  const selectedLabel = isRepair ? selectedSubcategory?.name || "" : displayGuardType(selectedGuard?.guard_type || "");
  const selectedPrice = isRepair ? selectedSubcategory?.price : selectedGuard?.price;
  const selectedPriceVisible = !isRepair || selectedSubcategory?.price_visible !== false;
  const serviceHomeHref = basePath || "/";
  const hasSavedProfile =
    name.trim().length > 0 &&
    isValidPhoneNumber(phone) &&
    address.trim().length > 0 &&
    city.trim().length > 0 &&
    isValidPincode(pincode);

  function buildFlowHref(step: FlowStep, overrides?: { category?: string | null; repair?: string | null; guard?: string | null }) {
    const params = new URLSearchParams();
    const category = overrides?.category ?? selectedCategoryId;
    const repair = overrides?.repair ?? selectedRepairId;
    const guard = overrides?.guard ?? selectedGuardId;

    if (step !== "select") {
      params.set("step", step);
    }
    if (category) {
      params.set("category", category);
    }
    if (repair) {
      params.set("repair", repair);
    }
    if (guard) {
      params.set("guard", guard);
    }

    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  function pushFlow(step: FlowStep, overrides?: { category?: string | null; repair?: string | null; guard?: string | null }) {
    window.history.pushState(null, "", buildFlowHref(step, overrides));
  }

  function replaceFlow(step: FlowStep, overrides?: { category?: string | null; repair?: string | null; guard?: string | null }) {
    window.history.replaceState(null, "", buildFlowHref(step, overrides));
  }

  function getInspectPosition() {
    return {
      lat: latitude ?? DEFAULT_INSPECT_LOCATION.lat,
      lng: longitude ?? DEFAULT_INSPECT_LOCATION.lng,
    };
  }

  async function saveCustomerProfile() {
    const profilePayload = buildCustomerProfileInsert({
      userId: user.id,
      fullName: name,
      phone,
      address,
      city,
      pincode,
      inspectLatitude: latitude,
      inspectLongitude: longitude,
    });
    return dataClient.from("customer_profiles").upsert(profilePayload as any, { onConflict: "user_id" }).select("user_id").single();
  }

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
        shouldCenterMapRef.current = true;
        googleMapRef.current?.setZoom(18);
        toast.success("Inspect location pinned.");
      },
      () => {
        setLocating(false);
        toast.error("Unable to detect location. Please allow location access.");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    );
  }

  useEffect(() => {
    pinEditableRef.current = pinEditable;
  }, [pinEditable]);

  useEffect(() => {
    const apiKey = GOOGLE_MAPS_API_KEY;
    if (!apiKey || typeof window === "undefined") {
      return;
    }

    if (window.google?.maps) {
      setMapReady(true);
      return;
    }

    if (!window.__looplicGoogleMapsLoading) {
      window.__looplicGoogleMapsLoading = new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`;
        script.async = true;
        script.defer = true;
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
    if (!mapReady || !mapElementRef.current || !window.google?.maps || googleMapRef.current) {
      return;
    }

    const position = getInspectPosition();
    googleMapRef.current = new window.google.maps.Map(mapElementRef.current, {
      center: position,
      zoom: 17,
      disableDefaultUI: true,
      zoomControl: false,
      draggable: pinEditable,
      gestureHandling: pinEditable ? "greedy" : "none",
      keyboardShortcuts: false,
      scrollwheel: pinEditable,
      disableDoubleClickZoom: !pinEditable,
      restriction: {
        latLngBounds: {
          north: position.lat + 0.012,
          south: position.lat - 0.012,
          east: position.lng + 0.012,
          west: position.lng - 0.012,
        },
        strictBounds: false,
      },
      styles: [
        { featureType: "poi", stylers: [{ visibility: "off" }] },
        { featureType: "transit", stylers: [{ visibility: "off" }] },
      ],
    });
    const detachMapListeners = attachMapListeners(googleMapRef.current, pinEditableRef, shouldCenterMapRef, setLatitude, setLongitude);

    return () => {
      detachMapListeners();
      googleMapRef.current = null;
    };
    // Create the map once; the next effect updates position/editability without rebuilding listeners.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady]);

  useEffect(() => {
    if (!mapReady || !googleMapRef.current) {
      return;
    }

    const position = getInspectPosition();
    googleMapRef.current.setOptions({
      draggable: pinEditable,
      gestureHandling: pinEditable ? "greedy" : "none",
      scrollwheel: pinEditable,
      disableDoubleClickZoom: !pinEditable,
      restriction: {
        latLngBounds: {
          north: position.lat + 0.012,
          south: position.lat - 0.012,
          east: position.lng + 0.012,
          west: position.lng - 0.012,
        },
        strictBounds: false,
      },
    });
    if (shouldCenterMapRef.current) {
      googleMapRef.current.panTo(position);
    }
    // `getInspectPosition` is derived from the state already listed here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude, mapReady, pinEditable]);

  useEffect(() => {
    let ignore = false;

    async function loadUser() {
      const {
        data: { session },
      } = await dataClient.auth.getSession();
      const currentUser = session?.user ?? null;

      if (!ignore) {
        setUser(currentUser);
        setAuthLoading(false);
      }
    }

    loadUser();

    const {
      data: { subscription },
    } = dataClient.auth.onAuthStateChange((_event, session) => {
      if (!ignore) {
        setUser(session?.user ?? null);
        setAuthLoading(false);
      }
    });

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, [dataClient.auth]);

  useEffect(() => {
    let ignore = false;

    async function hydrateProfile() {
      if (!user || profileLoaded) {
        return;
      }

      try {
        const { data: profileData } = await dataClient
          .from("customer_profiles")
          .select("full_name, phone, address, city, pincode, inspect_latitude, inspect_longitude")
          .eq("user_id", user.id)
          .maybeSingle();

        const customerProfile = profileData as
          | {
              full_name: string | null;
              phone: string | null;
              address: string | null;
              city: string | null;
              pincode: string | null;
              inspect_latitude: number | null;
              inspect_longitude: number | null;
            }
          | null;

        if (!ignore && customerProfile) {
          setName(customerProfile.full_name || "");
          setPhone(customerProfile.phone || "");
          setAddress(customerProfile.address || "");
          setCity(customerProfile.city || "");
          setPincode(customerProfile.pincode || "");
          setLatitude(customerProfile.inspect_latitude ?? null);
          setLongitude(customerProfile.inspect_longitude ?? null);
          if (customerProfile.inspect_latitude && customerProfile.inspect_longitude) {
            shouldCenterMapRef.current = true;
          }
        }

        const { data } = await dataClient
          .from("bookings")
          .select("customer_name, customer_phone, location, pincode, inspect_latitude, inspect_longitude")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const bookingProfile = data as
          | {
              customer_name: string | null;
              customer_phone: string | null;
              location: string | null;
              pincode: string | null;
              inspect_latitude: number | null;
              inspect_longitude: number | null;
            }
          | null;

        if (!ignore && bookingProfile && !customerProfile) {
          const parsedLocation = parseBookingLocation(bookingProfile.location);
          setName(bookingProfile.customer_name || "");
          setPhone(bookingProfile.customer_phone || "");
          setAddress(parsedLocation.address);
          setCity(parsedLocation.city);
          setPincode(bookingProfile.pincode || "");
          setLatitude(bookingProfile.inspect_latitude ?? null);
          setLongitude(bookingProfile.inspect_longitude ?? null);
          if (bookingProfile.inspect_latitude && bookingProfile.inspect_longitude) {
            shouldCenterMapRef.current = true;
          }
        }
      } finally {
        if (!ignore) {
          setProfileLoaded(true);
        }
      }
    }

    hydrateProfile();

    return () => {
      ignore = true;
    };
  }, [profileLoaded, dataClient, user]);

  useEffect(() => {
    if (currentStep === "repair" && !selectedCategoryId) {
      replaceFlow("select", { category: null, repair: null, guard: null });
      return;
    }

    if ((currentStep === "details" || currentStep === "schedule") && !selectedOption) {
      replaceFlow(isRepair && selectedCategoryId ? "repair" : "select", { repair: null, guard: null });
      return;
    }

    if (currentStep === "schedule" && user && profileLoaded && !hasSavedProfile) {
      replaceFlow("details");
    }
  }, [currentStep, hasSavedProfile, isRepair, profileLoaded, selectedCategoryId, selectedOption, user]);

  useEffect(() => {
    setOptionSearch("");
  }, [currentStep, selectedCategoryId, model.id]);

  useEffect(() => {
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    });
  }, [booked, currentStep, selectedCategoryId, selectedGuardId, selectedRepairId]);

  async function continueAfterSelection(selection: { guard?: string; category?: string; repair?: string }) {
    if (!user) {
      router.push(`/auth?redirect=${encodeURIComponent(buildFlowHref("details", selection))}`);
      return;
    }

    const nextStep = profileLoaded && hasSavedProfile ? "schedule" : "details";
    pushFlow(nextStep, selection);
  }

  async function handleBook() {
    if (!selectedOption || !selectedPrice) {
      toast.error("Please choose a service first");
      return;
    }
    if (!user) {
      router.push(`/auth?redirect=${encodeURIComponent(buildFlowHref("details"))}`);
      return;
    }
    if (!hasSavedProfile) {
      toast.error("Please complete your name, phone, address, city, and valid pincode");
      replaceFlow("details");
      return;
    }
    if (!scheduledDate || !timeSlot) {
      toast.error("Please select a date and time slot");
      return;
    }

    setSubmitting(true);
    const bookingServiceType = isRepair ? `${repairServiceType}_repair` : "screen_guard";
    const visitingCharge = formatVisitingCharge(bookingServiceType);
    const visitingChargePolicy = getVisitingChargePolicy(bookingServiceType);
    const { error: profileError } = await saveCustomerProfile();
    if (profileError) {
      toast.error(profileError.message);
      setSubmitting(false);
      return;
    }
    const insertData = buildBookingInsert({
        customerName: name,
        customerPhone: phone,
        modelId: model.id,
        address,
        city,
        pincode,
        scheduledDate,
        timeSlot,
        serviceType: bookingServiceType as any,
        userId: user.id,
        repairCategoryId: isRepair ? selectedCategoryId : null,
        repairSubcategoryId: isRepair ? selectedSubcategory?.id ?? null : null,
        guardType: !isRepair ? selectedGuard?.guard_type ?? null : null,
        inspectLatitude: latitude,
        inspectLongitude: longitude,
        notes: visitingChargePolicy,
      }) as BookingInsert;
    const bookingInsert = await dataClient.from("bookings").insert(insertData as any).select("booking_code").single();
    const bookingCode = bookingInsert.data?.booking_code || "";

    if (bookingInsert.error && isMissingBookingCodeColumnError(bookingInsert.error)) {
      const fallbackInsert = await dataClient.from("bookings").insert(insertData as any);
      if (fallbackInsert.error) {
        toast.error(fallbackInsert.error.message || "Booking failed. Please try again.");
        setSubmitting(false);
        return;
      }
    } else if (bookingInsert.error) {
      toast.error(bookingInsert.error.message || "Booking failed. Please try again.");
      setSubmitting(false);
      return;
    }

    void notifyLeadSubmission({
      source: "booking",
      title: "New scheduled Looplic booking",
      customer: { name, phone, email: user.email },
      service: {
        type: bookingServiceType,
        label: selectedLabel,
        price: selectedPrice,
      },
      device: {
        brand: brand.name,
        series: series.name,
        model: model.name,
      },
      schedule: {
        date: scheduledDate,
        timeSlot,
      },
      bookingCode,
      address,
      city,
      pincode,
      metadata: {
        flow: "BookingStepFlow",
        repairCategoryId: isRepair ? selectedCategoryId : undefined,
        repairSubcategoryId: isRepair ? selectedSubcategory?.id : undefined,
        guardType: !isRepair ? selectedGuard?.guard_type : undefined,
        latitude,
        longitude,
        visitingCharge,
      },
      notes: visitingChargePolicy,
    });

    downloadBookingConfirmationPdf({
      bookingCode,
      customerName: name,
      customerPhone: phone,
      serviceType: bookingServiceType,
      serviceLabel: selectedLabel,
      price: selectedPrice,
      brand: brand.name,
      series: series.name,
      model: model.name,
      scheduledDate,
      timeSlot,
      address,
      city,
      pincode,
      notes: visitingChargePolicy,
    });

    toast.success("Booking confirmed!");
    trackGoogleAdsConversion("booking_form_submit", {
      lead_type: "booking",
      source: "step_booking_form",
      booking_code: bookingCode,
      service_type: isRepair ? `${repairServiceType}_repair` : "screen_guard",
      value: Number(selectedPrice || 0),
      currency: "INR",
    });
    setBookedCode(bookingCode);
    setBooked(true);
    setSubmitting(false);
    router.push(buildThankYouHref({ type: "booking", source: "step_booking_form", booking_code: bookingCode, service_type: isRepair ? `${repairServiceType}_repair` : "screen_guard" }));
  }

  const inspectPosition = getInspectPosition();
  const inspectMapEmbedUrl = getInspectMapEmbedUrl(inspectPosition);

  if (booked) {
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full gradient-brand">
            <Check className="size-8 text-primary-foreground" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-foreground">Booking Confirmed!</h2>
          {bookedCode ? <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">{bookedCode}</p> : null}
          <p className="mb-1 text-sm text-muted-foreground">{selectedLabel} for <strong>{model.name}</strong></p>
          <p className="mb-1 text-xs text-muted-foreground">{scheduledDate} | {timeSlot}</p>
          <p className="mb-6 text-xs text-muted-foreground">We&apos;ll contact you at <strong>{phone}</strong> to confirm your slot.</p>
          <Link href={serviceHomeHref} className="inline-block rounded-2xl gradient-brand px-6 py-3 text-sm font-bold text-primary-foreground">Back to Home</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <div className="container py-6">
        <div className="mb-5 flex flex-wrap items-center gap-1 text-xs font-semibold text-muted-foreground">
          <Link href={serviceHomeHref} className="transition-colors hover:text-foreground">Home</Link>
          <ChevronRight className="size-3" />
          <Link href={`${basePath}/brands`} className="transition-colors hover:text-foreground">Brands</Link>
          <ChevronRight className="size-3" />
          <Link href={`${basePath}/brands/${brand.slug}`} className="transition-colors hover:text-foreground">{brand.name}</Link>
          <ChevronRight className="size-3" />
          <Link href={`${basePath}/brands/${brand.slug}/${series.slug}`} className="transition-colors hover:text-foreground">{series.name}</Link>
          <ChevronRight className="size-3" />
          <span className="text-foreground">{model.name}</span>
        </div>

        {currentStep !== "select" ? (
          <button
            type="button"
            onClick={() => {
              if (currentStep === "repair") pushFlow("select", { category: null, repair: null, guard: null });
              else if (currentStep === "details") pushFlow(isRepair ? "repair" : "select", { repair: null });
              else pushFlow(hasSavedProfile ? (isRepair ? "repair" : "select") : "details");
            }}
            className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="size-3.5" />
            Back
          </button>
        ) : null}

        <h1 className="mb-1 text-xl font-semibold text-foreground">
          {currentStep === "details" ? "Your Details and Inspect Location" : currentStep === "schedule" ? "Choose Date and Time Slot" : currentStep === "repair" ? "Choose Repair Service" : isRepair ? "Choose Repair Category" : "Choose Service"}
        </h1>
        <p className="mb-5 text-xs text-muted-foreground">for <span className="font-bold text-foreground">{brand.name} {model.name}</span></p>

        {currentStep === "select" || currentStep === "repair" ? (
          <div className="relative mb-5 max-w-sm">
            <input
              type="text"
              placeholder={
                currentStep === "repair"
                  ? "Search repair service..."
                  : isRepair
                    ? "Search repair category..."
                    : "Search service..."
              }
              value={optionSearch}
              onChange={(event) => setOptionSearch(event.target.value)}
              className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        ) : null}

        {currentStep === "select" && !isRepair ? (
          filteredGuards.length === 0 ? (
            <div className="py-16 text-center">
              <Shield className="mx-auto mb-3 size-10 text-muted-foreground/30" />
              <p className="text-sm font-semibold text-muted-foreground">
                {optionSearch ? "No services match your search" : "No services available for this model"}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredGuards.map((guard) => {
                const label = displayGuardType(guard.guard_type);
                return (
                  <button key={guard.id} onClick={() => continueAfterSelection({ guard: guard.id })} className="flex w-full items-center gap-3 rounded-2xl border-2 border-border bg-card p-4 text-left transition-all hover:border-primary/30 hover:shadow-card-brand">
                    {guard.image_url ? <img src={guard.image_url} alt={label} className="size-11 rounded-2xl object-contain border border-border/70 bg-background p-1.5" /> : <div className="flex size-11 items-center justify-center rounded-2xl border border-border/70 bg-secondary text-sm font-bold text-primary">{serviceBadges[label] || "Shield"}</div>}
                    <div className="flex-1"><span className="text-sm font-bold text-foreground">{label}</span></div>
                    <div className="text-right"><span className="text-lg font-extrabold gradient-brand-text">Rs. {guard.price}</span></div>
                  </button>
                );
              })}
            </div>
          )
        ) : null}

        {currentStep === "select" && isRepair ? (
          filteredCategories.length === 0 ? (
            <div className="py-16 text-center">
              <Wrench className="mx-auto mb-3 size-10 text-muted-foreground/30" />
              <p className="text-sm font-semibold text-muted-foreground">
                {optionSearch ? "No repair categories match your search" : "No repair categories available"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {filteredCategories.map((category) => (
                <button key={category.id} onClick={() => pushFlow("repair", { category: category.id, repair: null, guard: null })} className="flex flex-col items-center gap-2 rounded-2xl border-2 border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-card-brand">
                  {category.image_url ? <img src={category.image_url} alt={category.name} className="size-10 rounded-xl object-contain" /> : <div className="flex size-10 items-center justify-center rounded-xl bg-secondary"><Wrench className="size-5 text-primary" /></div>}
                  <span className="text-center text-xs font-bold text-foreground">{category.name}</span>
                </button>
              ))}
            </div>
          )
        ) : null}

        {currentStep === "repair" ? (
          <div className="space-y-2.5">
            <div className="rounded-2xl bg-secondary/60 p-4 text-sm text-foreground">
              <div className="font-bold">{selectedCategory?.name || "Repair Category"}</div>
              <div className="mt-1 text-xs text-muted-foreground">Choose the exact repair to continue</div>
            </div>
            {filteredSubcategories.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {optionSearch ? "No repair services match your search" : "No services available in this category"}
              </p>
            ) : (
              filteredSubcategories.map((subcategory) => (
                <button key={subcategory.id} onClick={() => continueAfterSelection({ category: selectedCategoryId || "", repair: subcategory.id })} className="flex w-full items-center gap-3 rounded-3xl border border-border/80 bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card-brand">
                  {subcategory.image_url ? <img src={subcategory.image_url} alt={subcategory.name} className="size-10 rounded-xl object-contain" /> : <div className="flex size-10 items-center justify-center rounded-xl bg-secondary"><Wrench className="size-5 text-muted-foreground" /></div>}
                  <div className="flex-1">
                    <span className="block text-sm font-bold text-foreground">{subcategory.name}</span>
                    <RepairWarrantyTag subcategoryName={subcategory.name} className="mt-2" />
                  </div>
                  {subcategory.price_visible !== false ? (
                    <div className="text-right">
                      <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Starts from</span>
                      <span className="text-lg font-semibold gradient-brand-text">Rs. {subcategory.price}</span>
                    </div>
                  ) : null}
                </button>
              ))
            )}
          </div>
        ) : null}

        {currentStep === "details" ? (
          authLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="size-6 animate-spin text-primary" /></div>
          ) : !user ? (
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card-brand">
              <h3 className="mb-2 text-base font-semibold text-foreground">Login or create account to continue</h3>
              <p className="mb-4 text-sm text-muted-foreground">Your saved name, phone, address, and future bookings will be reused across services.</p>
              <Link href={`/auth?redirect=${encodeURIComponent(buildFlowHref("details"))}`} className="inline-flex items-center gap-2 rounded-2xl gradient-brand px-5 py-3 text-sm font-bold text-primary-foreground"><LogIn className="size-4" />Login or Create Account</Link>
            </div>
          ) : (
            <section className="rounded-2xl border border-border bg-card p-5 shadow-card-brand">
              <div className="mb-4 rounded-2xl bg-secondary/60 p-4 text-sm text-foreground">
                <div className="font-bold">{selectedLabel}</div>
                <div className="mt-1 text-muted-foreground">{brand.name} {model.name}</div>
                {isRepair ? <RepairWarrantyTag subcategoryName={selectedLabel} className="mt-2" /> : null}
                {selectedPriceVisible ? <div className="mt-2 font-extrabold text-primary">Rs. {selectedPrice}</div> : null}
              </div>
              <div className="space-y-3">
                <div className="relative"><User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input type="text" placeholder="Your name" value={name} onChange={(event) => setName(event.target.value)} maxLength={100} className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
                <div className="relative"><Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input type="tel" placeholder="Phone number" value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={15} className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
                <div className="relative"><MapPin className="absolute left-3 top-3.5 size-4 text-muted-foreground" /><textarea placeholder="Inspect location address" value={address} onChange={(event) => setAddress(event.target.value)} rows={2} maxLength={200} className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
                <div className="rounded-3xl border border-emerald-200 bg-emerald-50/30 p-4 shadow-sm">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <h3 className="text-base font-semibold text-foreground">Inspect Location</h3>
                    <div className="flex size-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                      <MapPinned className="size-5" />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={useCurrentLocation}
                    disabled={locating}
                    aria-label="Use current location"
                    className="mb-3 flex w-full items-center justify-center gap-2 rounded-3xl border border-dashed border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-black text-foreground transition-colors hover:border-emerald-400 hover:bg-emerald-100/70 disabled:opacity-60"
                  >
                    {locating ? <Loader2 className="size-4 animate-spin text-emerald-600" /> : <Navigation className="size-4 text-emerald-600" />}
                    {locating ? "Fetching current location" : "Fetch Current location"}
                  </button>
                  <div className={`relative h-40 overflow-hidden rounded-3xl border border-border/70 bg-slate-100 shadow-inner ${pinEditable ? "ring-2 ring-emerald-300" : ""}`}>
                    <iframe
                      key={inspectMapEmbedUrl}
                      src={inspectMapEmbedUrl}
                      title={latitude && longitude ? "Pinned inspect location map" : "Bangalore inspect location map"}
                      className="absolute inset-0 z-0 size-full border-0"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                    <div ref={mapElementRef} className={`size-full bg-transparent ${mapReady && pinEditable ? "relative z-10" : "pointer-events-none absolute inset-0 z-0 opacity-0"}`} />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-16 bg-gradient-to-t from-background/35 to-transparent" />
                    <div className="pointer-events-none absolute left-1/2 top-1/2 z-30 flex -translate-x-1/2 -translate-y-full flex-col items-center">
                      <div className={`flex size-9 items-center justify-center rounded-full border-4 border-white shadow-xl transition-colors ${pinEditable ? "bg-emerald-600 text-white" : "bg-slate-900 text-white"}`}>
                        <MapPin className="size-5" />
                      </div>
                      <div className="h-3 w-0.5 bg-slate-900/70" />
                    </div>
                    {pinEditable ? (
                      <div className="pointer-events-none absolute bottom-3 left-3 z-30 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-black text-emerald-700 shadow-lg">
                        Move map to place pin
                      </div>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setPinEditable((editable) => !editable)}
                      className={`absolute right-3 top-3 z-40 flex size-10 items-center justify-center rounded-full bg-card shadow-lg transition-colors ${pinEditable ? "text-primary ring-2 ring-primary/20" : "text-emerald-600 hover:text-primary"}`}
                      title={pinEditable ? "Lock pin" : "Edit pin"}
                      aria-label="Edit map pin"
                    >
                      <Pencil className="size-5" />
                    </button>
                  </div>
                </div>
                <div className="relative"><MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input type="text" placeholder="City" value={city} onChange={(event) => setCity(event.target.value)} maxLength={80} className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
                <div className="relative"><Hash className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input type="text" placeholder="Pincode" value={pincode} onChange={(event) => setPincode(event.target.value)} maxLength={10} className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" /></div>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={async () => {
                    if (!user) {
                      router.push(`/auth?redirect=${encodeURIComponent(buildFlowHref("details"))}`);
                      return;
                    }
                    if (!hasSavedProfile) {
                      toast.error("Please complete your name, phone, address, city, and valid pincode");
                      return;
                    }
                    const { error } = await saveCustomerProfile();
                    if (error) {
                      toast.error(error.message);
                      return;
                    }
                    toast.success("Details saved");
                    pushFlow("schedule");
                  }}
                  className="rounded-2xl gradient-brand px-5 py-3 text-sm font-bold text-primary-foreground"
                >
                  Save and Continue
                </button>
              </div>
            </section>
          )
        ) : null}

        {currentStep === "schedule" ? (
          authLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="size-6 animate-spin text-primary" /></div>
          ) : !user ? (
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card-brand">
              <h3 className="mb-2 text-base font-semibold text-foreground">Login or create account to continue</h3>
              <Link href={`/auth?redirect=${encodeURIComponent(buildFlowHref("details"))}`} className="inline-flex items-center gap-2 rounded-2xl gradient-brand px-5 py-3 text-sm font-bold text-primary-foreground"><LogIn className="size-4" />Login or Create Account</Link>
            </div>
          ) : (
            <section className="rounded-2xl border border-border bg-card p-5 shadow-card-brand">
              <div className="mb-4 rounded-2xl bg-secondary/60 p-4 text-sm text-foreground">
                <div className="font-bold">{selectedLabel}</div>
                <div className="mt-1 text-muted-foreground">{brand.name} {model.name}</div>
                <div className="mt-1 text-muted-foreground">{address}, {city} - {pincode}</div>
                {isRepair ? <RepairWarrantyTag subcategoryName={selectedLabel} className="mt-2" /> : null}
                {selectedPriceVisible ? <div className="mt-2 font-extrabold text-primary">Rs. {selectedPrice}</div> : null}
              </div>
              <div className="space-y-4">
                <div>
                  <label htmlFor="field-bookingstepflow-882" className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Service Date</label>
                  <input id="field-bookingstepflow-882" type="date" min={getTodayDateString()} value={scheduledDate} onChange={(event) => setScheduledDate(event.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div>
                  <label htmlFor="field-bookingstepflow-886" className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Preferred Time Slot</label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {TIME_SLOTS.map((slot) => {
                      const isActive = timeSlot === slot;
                      return (
                        <button key={slot} type="button" onClick={() => setTimeSlot(slot)} className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-left text-sm font-bold transition-all ${isActive ? "border-primary bg-primary/5 text-foreground shadow-elevated-brand" : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground"}`}>
                          <Clock3 className="size-4" />
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold leading-5 text-amber-900">
                  Visiting charge: {formatVisitingCharge(isRepair ? `${repairServiceType}_repair` : "screen_guard")}. This visiting charge is waived once you claim the service from Looplic. If you do not claim the service, you have to pay the visiting charge.
                </div>
                <button type="button" onClick={handleBook} disabled={submitting || !scheduledDate || !timeSlot} className="flex w-full items-center justify-center gap-2 rounded-2xl gradient-brand py-3.5 text-sm font-extrabold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-60">
                  {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
                  {submitting ? "Booking..." : "Confirm Booking"}
                </button>
              </div>
            </section>
          )
        ) : null}
      </div>
    </main>
  );
}
