"use client";

import { Bell, Bike, CalendarClock, CheckCircle2, ChevronDown, ClipboardCheck, CreditCard, Download, IndianRupee, Loader2, LogOut, Mail, MapPin, Navigation, Phone, Plus, ReceiptText, Search, Trash2, UserCircle, Volume2, Wrench, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Input } from "@/src/components/ui/input";
import { InstallAppButton } from "@/src/components/next/InstallAppButton";
import { formatBookingServiceType, formatBookingStatus, formatCctvBookingSelection, type BookingRow } from "@/src/lib/bookings";
import { downloadInvoicePdf } from "@/src/lib/invoice-pdf";
import { createClient } from "@/src/lib/data-client/client";
import { useRoleSession } from "@/src/hooks/useRoleSession";
import { buildWarrantyFields, formatWarrantyLabel, getWarrantyPreset, WARRANTY_PRESETS, WARRANTY_UNITS } from "@/src/lib/warranty";

type TechBooking = BookingRow & {
  brand_name: string;
  model_name: string;
  assigned_rider?: string | null;
  assignment_notes?: string | null;
  warranty_duration_value?: number | null;
  warranty_duration_unit?: string | null;
  warranty_label?: string | null;
};

type Category = { id: string; name: string; service_type: string };
type Subcategory = { id: string; category_id: string; name: string; price: number };
type Inspection = {
  id: string;
  booking_id: string;
  repair_category_id: string | null;
  repair_subcategory_id: string | null;
  reported_issue: string | null;
  issue_severity: string | null;
  device_condition: string | null;
  accessories_received: string | null;
  customer_approval: string;
  pickup_required: boolean;
  pickup_notes: string | null;
  quote_amount: number;
  quote_notes: string | null;
  warranty_duration_value?: number | null;
  warranty_duration_unit?: string | null;
  warranty_label?: string | null;
  status: string;
};
type BillSummary = {
  id: string;
  booking_id: string | null;
  invoice_number: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  service_type: string | null;
  description: string | null;
  amount: number | null;
  discount: number | null;
  tax: number | null;
  total_amount: number | null;
  payment_status: string;
  payment_mode: string | null;
  notes: string | null;
  warranty_duration_value?: number | null;
  warranty_duration_unit?: string | null;
  warranty_label?: string | null;
  created_at: string | null;
};

type PickupAgreementForm = {
  customerEmail: string;
  pickupDate: string;
  pickupTime: string;
  dropDate: string;
  dropTime: string;
  pickupPerson: string;
  pickupAddress: string;
  issue: string;
  deviceCondition: string;
  accessories: string;
  estimatedQuote: string;
  notes: string;
};

type LaptopInspectionForm = {
  issueArea: string;
  powerStatus: string;
  bootStatus: string;
  batteryHealth: string;
  chargerStatus: string;
  storageStatus: string;
  dataBackup: string;
  serialNumber: string;
};

type CctvInspectionForm = {
  propertyType: string;
  cameraCount: string;
  recorderType: string;
  hddCapacityGb: string;
  storageDays: string;
  wiringRoute: string;
  powerAvailability: string;
  internetStatus: string;
  mobileViewing: string;
  siteAccess: string;
  mountingNotes: string;
};

type QuoteLineItem = {
  id: string;
  label: string;
  amount: string;
};

type ModelLookup = { id: string; name: string; series_id: string };
type SeriesLookup = { id: string; brand_id: string };
type NamedLookup = { id: string; name: string };

const statusStyles: Record<string, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  confirmed: "border-sky-200 bg-sky-50 text-sky-800",
  in_progress: "border-violet-200 bg-violet-50 text-violet-800",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  cancelled: "border-rose-200 bg-rose-50 text-rose-800",
};
const milestoneLabels = ["Assigned", "Accepted", "Pickup", "Fixed"] as const;
const TECHNICIAN_DASHBOARD_PATH = "/technician";
const ALERTS_STORAGE_KEY = "looplic-technician-order-alerts-enabled";
const ALERTED_ASSIGNMENTS_STORAGE_PREFIX = "looplic-technician-alerted-assignments";
const ASSIGNMENT_SIREN_SECONDS = 8;
const ALERT_TEST_SIREN_SECONDS = 1.2;
const RECENT_ASSIGNMENT_ALERT_WINDOW_MS = 15 * 60 * 1000;
const emptyPickupAgreementForm: PickupAgreementForm = {
  customerEmail: "",
  pickupDate: "",
  pickupTime: "",
  dropDate: "",
  dropTime: "",
  pickupPerson: "",
  pickupAddress: "",
  issue: "",
  deviceCondition: "",
  accessories: "",
  estimatedQuote: "",
  notes: "",
};
const emptyLaptopInspection: LaptopInspectionForm = {
  issueArea: "",
  powerStatus: "",
  bootStatus: "",
  batteryHealth: "",
  chargerStatus: "",
  storageStatus: "",
  dataBackup: "",
  serialNumber: "",
};
const emptyCctvInspection: CctvInspectionForm = {
  propertyType: "",
  cameraCount: "",
  recorderType: "",
  hddCapacityGb: "",
  storageDays: "",
  wiringRoute: "",
  powerAvailability: "",
  internetStatus: "",
  mobileViewing: "",
  siteAccess: "",
  mountingNotes: "",
};
const laptopIssueAreas = ["Display", "Keyboard", "Battery", "Charging", "No power", "Slow performance", "Software", "Hinge/body", "Liquid damage", "Data recovery"];

function getNoteValue(notes: string | null | undefined, label: string) {
  if (!notes) return "";
  const match = notes.match(new RegExp(`${label}:\\s*([^\\n]+)`, "i"));
  return match?.[1]?.trim() || "";
}

function getLaptopBookingDetails(booking: TechBooking | null | undefined) {
  if (!booking) {
    return { brand: "", issue: "", customerNote: "" };
  }

  return {
    brand: booking.brand_name || getNoteValue(booking.notes, "Laptop brand"),
    issue: getNoteValue(booking.notes, "Issue"),
    customerNote: getNoteValue(booking.notes, "Customer note"),
  };
}
const cctvPropertyTypes = ["Apartment", "Independent house", "Shop", "Office", "Warehouse", "PG/Hostel", "Restaurant", "Other"];
const recorderTypes = ["DVR", "NVR", "WiFi camera", "Hybrid", "Not available", "To be installed"];
const pickupTimeOptions = Array.from({ length: 48 }, (_, index) => {
  const minutes = index * 30;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const value = `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
  const label = new Date(2026, 0, 1, hours, mins).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return { value, label };
});

function money(value: number | string | null | undefined) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function getNavigationUrl(booking: TechBooking) {
  if (booking.inspect_latitude && booking.inspect_longitude) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${booking.inspect_latitude},${booking.inspect_longitude}`)}&travelmode=driving`;
  }

  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent([booking.location, booking.pincode].filter(Boolean).join(" "))}&travelmode=driving`;
}

function getCurrentNotificationPermission(): NotificationPermission {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "default";
  }

  return Notification.permission;
}

function isBookingAssignedToTechnician(booking: TechBooking, technicianEmail?: string | null) {
  const rider = booking.assigned_rider?.trim().toLowerCase();
  const email = technicianEmail?.trim().toLowerCase();

  return Boolean(rider && email && rider === email);
}

function getAssignmentFingerprint(booking: TechBooking) {
  return [booking.assigned_rider || "", booking.assigned_at || ""].join("|");
}

function getAssignmentAlertKey(booking: TechBooking) {
  return `${booking.id}:${getAssignmentFingerprint(booking)}`;
}

function getAssignmentTime(booking: TechBooking) {
  const assignedAt = booking.assigned_at ? Date.parse(booking.assigned_at) : Number.NaN;
  return Number.isFinite(assignedAt) ? assignedAt : 0;
}

function isRecentlyAssigned(booking: TechBooking) {
  const assignmentTime = getAssignmentTime(booking);
  return assignmentTime > 0 && Date.now() - assignmentTime <= RECENT_ASSIGNMENT_ALERT_WINDOW_MS;
}

function toDateTimeLocalInput(date: Date) {
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function toDateInput(date: Date) {
  return toDateTimeLocalInput(date).slice(0, 10);
}

function toTimeValue(date: Date) {
  const minutes = date.getHours() * 60 + date.getMinutes();
  const rounded = Math.ceil(minutes / 30) * 30;
  const normalized = rounded >= 24 * 60 ? 0 : rounded;
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function formatDateLabel(value: string) {
  if (!value) return "Select date";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "Select date";
  return date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

function buildDateTimeValue(date: string, time: string) {
  if (!date || !time) return "";
  return `${date}T${time}`;
}

function readLocalStorage(key: string) {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocalStorage(key: string, value: string) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable in some mobile/private browser modes.
  }
}

export function TechnicianDashboardClient() {
  const router = useRouter();
  const dataClient = createClient() as any;
  const { user, hasRole, loading, signOut } = useRoleSession("technician");
  const [bookings, setBookings] = useState<TechBooking[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [bills, setBills] = useState<BillSummary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [assignmentAlert, setAssignmentAlert] = useState<TechBooking | null>(null);
  const assignmentAlertId = assignmentAlert?.id;
  const [assignmentAlertSeconds, setAssignmentAlertSeconds] = useState(ASSIGNMENT_SIREN_SECONDS);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
  const [alertsOptedIn, setAlertsOptedIn] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState<"orders" | "pickup" | "fixed" | "earnings">("orders");
  const [query, setQuery] = useState("");
  const [earningStatusFilter, setEarningStatusFilter] = useState("all");
  const [inspectTarget, setInspectTarget] = useState<TechBooking | null>(null);
  const [quoteTarget, setQuoteTarget] = useState<TechBooking | null>(null);
  const [saving, setSaving] = useState(false);
  const [pickupAgreementOpen, setPickupAgreementOpen] = useState(false);
  const [pickupAgreement, setPickupAgreement] = useState<PickupAgreementForm>(emptyPickupAgreementForm);
  const [pickupEmailLoading, setPickupEmailLoading] = useState(false);
  const [pickupEmailSource, setPickupEmailSource] = useState<"auto" | "manual" | "unavailable">("manual");

  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [reportedIssue, setReportedIssue] = useState("");
  const [condition, setCondition] = useState("");
  const [accessories, setAccessories] = useState("");
  const [approval, setApproval] = useState("pending");
  const [pickupNotes, setPickupNotes] = useState("");
  const [quoteAmount, setQuoteAmount] = useState("");
  const [quoteNotes, setQuoteNotes] = useState("");
  const [warrantyPreset, setWarrantyPreset] = useState("none");
  const [warrantyValue, setWarrantyValue] = useState("");
  const [warrantyUnit, setWarrantyUnit] = useState("months");
  const [laptopInspection, setLaptopInspection] = useState<LaptopInspectionForm>(emptyLaptopInspection);
  const [cctvInspection, setCctvInspection] = useState<CctvInspectionForm>(emptyCctvInspection);
  const [quoteItems, setQuoteItems] = useState<QuoteLineItem[]>([]);
  const knownAssignmentFingerprintsRef = useRef<Map<string, string>>(new Map());
  const alertedAssignmentsRef = useRef<Set<string>>(new Set());
  const alertedAssignmentsLoadedForRef = useRef<string | null>(null);
  const alertsOptedInRef = useRef(false);
  const assignmentWatcherReadyRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!loading && (!user || !hasRole)) {
      router.replace("/technician/login");
    }
  }, [hasRole, loading, router, user]);

  function getAlertedAssignmentsStorageKey() {
    return `${ALERTED_ASSIGNMENTS_STORAGE_PREFIX}:${user?.id || "anonymous"}`;
  }

  function hydrateAlertedAssignments() {
    const storageKey = getAlertedAssignmentsStorageKey();
    if (alertedAssignmentsLoadedForRef.current === storageKey) return;

    try {
      const stored = JSON.parse(readLocalStorage(storageKey) || "[]");
      alertedAssignmentsRef.current = new Set(Array.isArray(stored) ? stored.filter((item): item is string => typeof item === "string") : []);
    } catch {
      alertedAssignmentsRef.current = new Set();
    }

    alertedAssignmentsLoadedForRef.current = storageKey;
  }

  function saveAlertedAssignments() {
    writeLocalStorage(getAlertedAssignmentsStorageKey(), JSON.stringify([...alertedAssignmentsRef.current].slice(-200)));
  }

  function markAssignmentAlerted(booking: TechBooking) {
    alertedAssignmentsRef.current.add(getAssignmentAlertKey(booking));
    saveAlertedAssignments();
  }

  function hasAssignmentBeenAlerted(booking: TechBooking) {
    return alertedAssignmentsRef.current.has(getAssignmentAlertKey(booking));
  }

  async function showBrowserNotification(booking: TechBooking) {
    if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") {
      return;
    }

    const options: NotificationOptions & { vibrate?: number[] } = {
      body: booking.booking_code ? `Order ${booking.booking_code}` : "Open the technician dashboard.",
      tag: `looplic-order-${booking.id}`,
      requireInteraction: true,
      vibrate: [500, 150, 500, 150, 500, 150, 500, 150, 400],
    };

    try {
      const registration = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration().catch(() => undefined) : undefined;
      if (registration?.showNotification) {
        await registration.showNotification("New order assigned", options);
        return;
      }

      const notification = new Notification("New order assigned", options);

      notification.onclick = () => {
        window.focus();
        window.location.href = TECHNICIAN_DASHBOARD_PATH;
        notification.close();
      };
    } catch {
      // Notifications are best-effort; the in-app alert still handles the order.
    }
  }

  async function ensureAudioContext() {
    if (typeof window === "undefined") return null;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;

    const context = audioContextRef.current || new AudioContextClass();
    audioContextRef.current = context;

    if (context.state === "suspended") {
      await context.resume();
    }

    setAudioEnabled(context.state === "running");
    return context.state === "running" ? context : null;
  }

  async function enableOrderAlerts() {
    if (typeof window === "undefined") return;

    let nextAudioEnabled = false;

    try {
      nextAudioEnabled = Boolean(await ensureAudioContext());
    } catch {
      setAudioEnabled(false);
    }

    let permission = getCurrentNotificationPermission();
    if ("Notification" in window) {
      permission = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
      setNotificationPermission(permission);
    } else {
      setNotificationPermission("default");
    }

    const enabled = permission === "granted" || nextAudioEnabled;
    setAlertsOptedIn(enabled);
    writeLocalStorage(ALERTS_STORAGE_KEY, enabled ? "true" : "false");

    if (permission === "granted") {
      toast.success(nextAudioEnabled ? "Order alerts enabled." : "Order notifications enabled.");
      if (nextAudioEnabled) {
        void playAssignmentSiren(ALERT_TEST_SIREN_SECONDS);
      }
    } else if (permission === "denied" && nextAudioEnabled) {
      toast.warning("Sound alerts enabled. Browser notifications are blocked in this browser.");
      void playAssignmentSiren(ALERT_TEST_SIREN_SECONDS);
    } else if (permission === "denied") {
      toast.error("Browser notifications are blocked. Enable them in site settings.");
    } else if (nextAudioEnabled) {
      toast.success("Sound alerts enabled.");
      void playAssignmentSiren(ALERT_TEST_SIREN_SECONDS);
    } else {
      toast.error("This browser could not enable order alerts.");
    }
  }

  async function playAssignmentSiren(durationSeconds = ASSIGNMENT_SIREN_SECONDS) {
    if (typeof window === "undefined") return false;

    try {
      const context = await ensureAudioContext();
      if (!context) {
        return false;
      }

      const compressor = context.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-22, context.currentTime);
      compressor.knee.setValueAtTime(18, context.currentTime);
      compressor.ratio.setValueAtTime(10, context.currentTime);
      compressor.attack.setValueAtTime(0.003, context.currentTime);
      compressor.release.setValueAtTime(0.16, context.currentTime);

      const masterGain = context.createGain();
      const pulseGain = context.createGain();
      const filter = context.createBiquadFilter();
      const stopAt = context.currentTime + durationSeconds;

      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1300, context.currentTime);
      filter.Q.setValueAtTime(0.9, context.currentTime);

      masterGain.gain.setValueAtTime(0.0001, context.currentTime);
      masterGain.gain.exponentialRampToValueAtTime(0.78, context.currentTime + 0.06);
      masterGain.gain.setValueAtTime(0.78, Math.max(context.currentTime + 0.1, stopAt - 0.24));
      masterGain.gain.exponentialRampToValueAtTime(0.0001, stopAt);

      pulseGain.gain.setValueAtTime(0.2, context.currentTime);
      for (let time = context.currentTime; time < stopAt; time += 0.36) {
        pulseGain.gain.setValueAtTime(0.2, time);
        pulseGain.gain.linearRampToValueAtTime(1, Math.min(time + 0.08, stopAt));
        pulseGain.gain.linearRampToValueAtTime(0.28, Math.min(time + 0.18, stopAt));
        pulseGain.gain.linearRampToValueAtTime(1, Math.min(time + 0.28, stopAt));
      }

      const oscillators = [
        { type: "sawtooth" as OscillatorType, gain: 0.62, low: 620, high: 1280 },
        { type: "square" as OscillatorType, gain: 0.2, low: 930, high: 1760 },
        { type: "triangle" as OscillatorType, gain: 0.16, low: 310, high: 640 },
      ].map((voice) => {
        const oscillator = context.createOscillator();
        const voiceGain = context.createGain();
        oscillator.type = voice.type;
        voiceGain.gain.setValueAtTime(voice.gain, context.currentTime);

        for (let time = context.currentTime; time < stopAt; time += 0.72) {
          oscillator.frequency.setValueAtTime(voice.low, time);
          oscillator.frequency.linearRampToValueAtTime(voice.high, Math.min(time + 0.34, stopAt));
          oscillator.frequency.linearRampToValueAtTime(voice.low, Math.min(time + 0.72, stopAt));
        }

        oscillator.connect(voiceGain);
        voiceGain.connect(filter);
        oscillator.start(context.currentTime);
        oscillator.stop(stopAt);
        return oscillator;
      });

      filter.connect(pulseGain);
      pulseGain.connect(masterGain);
      masterGain.connect(compressor);
      compressor.connect(context.destination);

      oscillators.forEach((oscillator) => {
        oscillator.onended = () => {
          oscillator.disconnect();
        };
      });
      setAudioEnabled(true);
      return true;
    } catch {
      setAudioEnabled(false);
      return false;
    }
  }

  function alertNewAssignment(booking: TechBooking) {
    if (hasAssignmentBeenAlerted(booking)) return;

    markAssignmentAlerted(booking);
    setAssignmentAlertSeconds(ASSIGNMENT_SIREN_SECONDS);
    setAssignmentAlert(booking);
    if (alertsOptedInRef.current) {
      void playAssignmentSiren();
      void showBrowserNotification(booking);
    }
    toast.success("New order assigned.", { duration: ASSIGNMENT_SIREN_SECONDS * 1000 });
  }

  async function loadData(options?: { silent?: boolean }) {
    if (!user) return;
    hydrateAlertedAssignments();
    if (!options?.silent) {
      setLoadingData(true);
    }
    const [bookingResult, catalogResult, inspectionResult, billResult] = await Promise.all([
      dataClient.from("bookings").select("*").order("created_at", { ascending: false }),
      fetch("/api/catalog/repair-options").then((response) => response.ok ? response.json() : { categories: [], subcategories: [] }).catch(() => ({ categories: [], subcategories: [] })),
      dataClient.from("booking_inspections").select("*").order("created_at", { ascending: false }),
      dataClient.from("service_bills").select("*").order("created_at", { ascending: false }),
    ]);

    const rawRows = (bookingResult.data || []) as TechBooking[];
    const rows = rawRows.filter((booking) => isBookingAssignedToTechnician(booking, user.email));
    const modelIds = [...new Set(rows.map((booking) => booking.model_id).filter(Boolean))] as string[];
    const { data: models } = modelIds.length ? await dataClient.from("models").select("id, name, series_id").in("id", modelIds) : { data: [] };
    const typedModels = (models || []) as ModelLookup[];
    const seriesIds = [...new Set(typedModels.map((model) => model.series_id).filter(Boolean))];
    const { data: seriesRows } = seriesIds.length ? await dataClient.from("series").select("id, brand_id").in("id", seriesIds) : { data: [] };
    const typedSeriesRows = (seriesRows || []) as SeriesLookup[];
    const brandIds = [...new Set(typedSeriesRows.map((series) => series.brand_id).filter(Boolean))];
    const { data: brandRows } = brandIds.length ? await dataClient.from("brands").select("id, name").in("id", brandIds) : { data: [] };

    const typedBrandRows = (brandRows || []) as NamedLookup[];
    const modelMap = new Map<string, ModelLookup>(typedModels.map((model) => [model.id, model]));
    const seriesMap = new Map<string, SeriesLookup>(typedSeriesRows.map((series) => [series.id, series]));
    const brandMap = new Map<string, string>(typedBrandRows.map((brand) => [brand.id, brand.name]));

    const enrichedRows = rows.map((booking) => {
        const model = booking.model_id ? modelMap.get(booking.model_id) : undefined;
        const series = model ? seriesMap.get(model.series_id) : undefined;
        return {
          ...booking,
          model_name: model?.name || "",
          brand_name: series ? brandMap.get(series.brand_id) || "" : "",
        };
      });

    const nextAssignmentFingerprints = new Map(
      enrichedRows
        .filter((booking) => isBookingAssignedToTechnician(booking, user.email))
        .map((booking) => [booking.id, getAssignmentFingerprint(booking)]),
    );

    if (assignmentWatcherReadyRef.current) {
      const newAssignments = enrichedRows.filter((booking) => {
        if (!isBookingAssignedToTechnician(booking, user.email)) return false;

        const nextFingerprint = nextAssignmentFingerprints.get(booking.id);
        const previousFingerprint = knownAssignmentFingerprintsRef.current.get(booking.id);

        return Boolean(nextFingerprint && nextFingerprint !== previousFingerprint);
      });
      if (newAssignments.length > 0) {
        alertNewAssignment(newAssignments[0]);
      }
    } else {
      const recentAssignment = enrichedRows
        .filter((booking) => isBookingAssignedToTechnician(booking, user.email))
        .filter((booking) => isRecentlyAssigned(booking) && !hasAssignmentBeenAlerted(booking))
        .sort((left, right) => getAssignmentTime(right) - getAssignmentTime(left))[0];

      if (recentAssignment) {
        alertNewAssignment(recentAssignment);
      }
    }
    knownAssignmentFingerprintsRef.current = nextAssignmentFingerprints;
    assignmentWatcherReadyRef.current = true;

    setBookings(enrichedRows);
    setAssignmentAlert((currentAlert) => currentAlert && nextAssignmentFingerprints.has(currentAlert.id) ? currentAlert : null);
    setCategories((catalogResult.categories || []) as Category[]);
    setSubcategories((catalogResult.subcategories || []) as Subcategory[]);
    setInspections((inspectionResult.data || []) as Inspection[]);
    setBills((billResult.data || []) as BillSummary[]);
    setLoadingData(false);
  }

  useEffect(() => {
    if (user && hasRole) {
      loadData();
    }
    // Initial hydrate only when technician identity/role changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, hasRole]);

  useEffect(() => {
    alertsOptedInRef.current = alertsOptedIn;
  }, [alertsOptedIn]);

  useEffect(() => {
    if (!profileMenuOpen || typeof window === "undefined") return;

    function closeProfileMenu(event: MouseEvent) {
      if (profileMenuRef.current?.contains(event.target as Node)) return;
      setProfileMenuOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setProfileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", closeProfileMenu);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeProfileMenu);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [profileMenuOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    const syncAlertState = () => {
      const storedOptIn = readLocalStorage(ALERTS_STORAGE_KEY) === "true";
      const permission = getCurrentNotificationPermission();
      setNotificationPermission(permission);
      setAlertsOptedIn(storedOptIn && permission !== "denied");

      if (storedOptIn && audioContextRef.current?.state === "suspended") {
        void audioContextRef.current.resume().then(() => {
          setAudioEnabled(audioContextRef.current?.state === "running");
        }).catch(() => setAudioEnabled(false));
      }

    };

    syncAlertState();
    window.addEventListener("focus", syncAlertState);
    document.addEventListener("visibilitychange", syncAlertState);

    return () => {
      window.removeEventListener("focus", syncAlertState);
      document.removeEventListener("visibilitychange", syncAlertState);
    };
  }, []);

  useEffect(() => {
    if (!user?.id || typeof window === "undefined") return;

    hydrateAlertedAssignments();
    // Alert history is scoped to the current technician session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!assignmentAlertId) return;

    setAssignmentAlertSeconds(ASSIGNMENT_SIREN_SECONDS);
    const interval = window.setInterval(() => {
      setAssignmentAlertSeconds((seconds) => Math.max(seconds - 1, 0));
    }, 1000);
    const timeout = window.setTimeout(() => {
      setAssignmentAlert(null);
    }, ASSIGNMENT_SIREN_SECONDS * 1000);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [assignmentAlertId]);

  useEffect(() => {
    if (!alertsOptedIn || typeof window === "undefined") return;

    function unlockAudioOnGesture() {
      if (audioContextRef.current?.state === "suspended") {
        void audioContextRef.current.resume().then(() => {
          setAudioEnabled(audioContextRef.current?.state === "running");
        }).catch(() => setAudioEnabled(false));
      }
    }

    window.addEventListener("pointerdown", unlockAudioOnGesture, { once: true });
    window.addEventListener("keydown", unlockAudioOnGesture, { once: true });

    return () => {
      window.removeEventListener("pointerdown", unlockAudioOnGesture);
      window.removeEventListener("keydown", unlockAudioOnGesture);
    };
  }, [alertsOptedIn]);

  useEffect(() => {
    if (!user || !hasRole) return;

    const channel = dataClient
      .channel(`technician-assignment-alerts-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => {
        void loadData({ silent: true });
      })
      .subscribe();
    const interval = window.setInterval(() => {
      void loadData({ silent: true });
    }, 30000);

    return () => {
      window.clearInterval(interval);
      void channel.unsubscribe();
    };
    // Keep one realtime subscription per technician session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, hasRole]);

  const inspectionByBooking = useMemo(() => new Map(inspections.map((inspection) => [inspection.booking_id, inspection])), [inspections]);
  const billByBooking = useMemo(() => {
    const map = new Map<string | null, BillSummary>();
    bills.forEach((bill) => {
      if (bill.booking_id && !map.has(bill.booking_id)) {
        map.set(bill.booking_id, bill);
      }
    });
    return map;
  }, [bills]);
  function handleDownloadInvoice(bill: BillSummary, booking?: TechBooking) {
    downloadInvoicePdf({
      id: bill.id,
      invoice_number: bill.invoice_number,
      customer_name: bill.customer_name || booking?.customer_name || "Customer",
      customer_phone: bill.customer_phone || booking?.customer_phone || null,
      service_type: bill.service_type || booking?.service_type || "",
      description: bill.description || null,
      amount: Number(bill.amount || bill.total_amount || 0),
      discount: Number(bill.discount || 0),
      tax: Number(bill.tax || 0),
      total_amount: Number(bill.total_amount || bill.amount || 0),
      payment_status: bill.payment_status || "paid",
      payment_mode: bill.payment_mode || null,
      notes: bill.notes || null,
      warranty_duration_value: bill.warranty_duration_value ?? booking?.warranty_duration_value ?? null,
      warranty_duration_unit: bill.warranty_duration_unit ?? booking?.warranty_duration_unit ?? null,
      warranty_label: bill.warranty_label ?? booking?.warranty_label ?? null,
      created_at: bill.created_at || new Date().toISOString(),
    });
  }

  function hydrateWarranty(value?: number | null, unit?: string | null, label?: string | null) {
    const preset = getWarrantyPreset(value, unit);
    setWarrantyPreset(preset);
    setWarrantyValue(value ? String(value) : "");
    setWarrantyUnit(unit || "months");
    return label || formatWarrantyLabel(value, unit);
  }
  const bookingById = useMemo(() => new Map(bookings.map((booking) => [booking.id, booking])), [bookings]);
  const visibleBookings = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return bookings.filter((booking) => {
      const inspection = inspectionByBooking.get(booking.id);
      const bucket =
        activeView === "orders"
          ? !inspection || ["inspection", "accepted"].includes(inspection.status)
          : activeView === "pickup"
            ? inspection?.status === "pickup"
            : activeView === "fixed"
              ? inspection?.status === "fixed" || booking.status === "completed"
              : false;
      const matchesQuery =
        !normalized ||
        [booking.booking_code, booking.customer_name, booking.customer_phone, booking.brand_name, booking.model_name, booking.location]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalized));
      return bucket && matchesQuery;
    });
  }, [activeView, bookings, inspectionByBooking, query]);

  const technicianBills = useMemo(() => {
    const seenBookings = new Set<string>();
    return bills.filter((bill) => {
      if (!bill.booking_id || !bookingById.has(bill.booking_id) || seenBookings.has(bill.booking_id)) return false;
      seenBookings.add(bill.booking_id);
      return true;
    });
  }, [bills, bookingById]);
  const filteredEarningBills = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return technicianBills.filter((bill) => {
      const booking = bill.booking_id ? bookingById.get(bill.booking_id) : undefined;
      const matchesStatus = earningStatusFilter === "all" || bill.payment_status === earningStatusFilter;
      const matchesQuery =
        !normalized ||
        [bill.invoice_number, bill.customer_name, bill.description, booking?.booking_code, booking?.customer_phone, formatBookingServiceType(bill.service_type || booking?.service_type || "")]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalized));
      return matchesStatus && matchesQuery;
    });
  }, [bookingById, earningStatusFilter, query, technicianBills]);

  const today = new Date().toISOString().slice(0, 10);
  const paidTechnicianBills = technicianBills.filter((bill) => bill.payment_status === "paid");
  const todayPaidBills = paidTechnicianBills.filter((bill) => bill.created_at?.slice(0, 10) === today);
  const totalEarning = paidTechnicianBills.reduce((sum, bill) => sum + Number(bill.total_amount || bill.amount || 0), 0);
  const todayEarning = todayPaidBills.reduce((sum, bill) => sum + Number(bill.total_amount || bill.amount || 0), 0);
  const pendingCollection = technicianBills.filter((bill) => bill.payment_status !== "paid" && bill.payment_status !== "cancelled").reduce((sum, bill) => sum + Number(bill.total_amount || bill.amount || 0), 0);
  const alertsActive = alertsOptedIn && notificationPermission !== "denied" && (notificationPermission === "granted" || audioEnabled);
  const alertButtonLabel = notificationPermission === "denied" ? "Alerts blocked" : alertsActive ? "Alerts on" : "Enable alerts";

  const selectedCategoryOptions = useMemo(() => {
    const serviceType = inspectTarget?.service_type === "laptop_repair" ? "laptop" : "mobile";
    return categories.filter((category) => category.service_type === serviceType);
  }, [categories, inspectTarget?.service_type]);
  const selectedSubcategoryOptions = useMemo(() => subcategories.filter((subcategory) => subcategory.category_id === categoryId), [categoryId, subcategories]);

  function getMilestone(booking: TechBooking, inspection?: Inspection) {
    if (booking.status === "completed" || inspection?.status === "fixed") return 3;
    if (inspection?.status === "pickup") return 2;
    if (inspection) return 1;
    return 0;
  }

  function isClosedOrder(booking: TechBooking) {
    return booking.status === "completed" && billByBooking.get(booking.id)?.payment_status === "paid";
  }

  async function handleSignOut() {
    await signOut();
    router.replace("/technician/login");
  }

  async function acceptOrder(booking: TechBooking) {
    await dataClient.from("bookings").update({ status: "confirmed" }).eq("id", booking.id);
    await dataClient.from("booking_inspections").insert({
      booking_id: booking.id,
      technician_id: user?.id,
      technician_name: user?.email,
      device_brand: booking.brand_name,
      device_model: booking.model_name,
      status: "accepted",
    });
    toast.success("Order accepted.");
    loadData();
  }

  function openInspection(booking: TechBooking) {
    const inspection = inspectionByBooking.get(booking.id);
    const laptopDetails = getLaptopBookingDetails(booking);
    setInspectTarget(booking);
    setPickupAgreementOpen(false);
    setCategoryId(inspection?.repair_category_id || booking.repair_category_id || "");
    setSubcategoryId(inspection?.repair_subcategory_id || booking.repair_subcategory_id || "");
    setReportedIssue(inspection?.reported_issue || laptopDetails.customerNote || laptopDetails.issue || booking.notes || "");
    setCondition(inspection?.device_condition || "");
    setAccessories(inspection?.accessories_received || "");
    setApproval(inspection?.customer_approval || "pending");
    setPickupNotes(inspection?.pickup_notes || "");
    setQuoteAmount(inspection?.quote_amount ? String(inspection.quote_amount) : "");
    setQuoteNotes(inspection?.quote_notes || "");
    setLaptopInspection(booking.service_type === "laptop_repair"
      ? { ...emptyLaptopInspection, issueArea: laptopDetails.issue || emptyLaptopInspection.issueArea }
      : emptyLaptopInspection);
    setCctvInspection(emptyCctvInspection);
    hydrateWarranty(inspection?.warranty_duration_value ?? booking.warranty_duration_value, inspection?.warranty_duration_unit ?? booking.warranty_duration_unit, inspection?.warranty_label ?? booking.warranty_label);
  }

  function patchPickupAgreement(patch: Partial<PickupAgreementForm>) {
    setPickupAgreement((current) => ({ ...current, ...patch }));
  }

  function patchLaptopInspection(patch: Partial<LaptopInspectionForm>) {
    setLaptopInspection((current) => ({ ...current, ...patch }));
  }

  function patchCctvInspection(patch: Partial<CctvInspectionForm>) {
    setCctvInspection((current) => ({ ...current, ...patch }));
  }

  function formatDetails(title: string, rows: Array<[string, string | number | null | undefined]>) {
    const details = rows
      .map(([label, value]) => [label, String(value ?? "").trim()] as const)
      .filter(([, value]) => value.length > 0)
      .map(([label, value]) => `${label}: ${value}`);

    return details.length ? `${title}\n${details.join("\n")}` : "";
  }

  function createQuoteItem(label = "", amount = ""): QuoteLineItem {
    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      label,
      amount,
    };
  }

  function patchQuoteItem(id: string, patch: Partial<QuoteLineItem>) {
    setQuoteItems((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item));
  }

  function addQuoteItem() {
    setQuoteItems((items) => [...items, createQuoteItem()]);
  }

  function removeQuoteItem(id: string) {
    setQuoteItems((items) => items.length > 1 ? items.filter((item) => item.id !== id) : items);
  }

  function getQuoteItemsTotal(items = quoteItems) {
    return items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }

  function buildQuoteDescription(items = quoteItems) {
    const lines = items
      .filter((item) => item.label.trim() || Number(item.amount || 0) > 0)
      .map((item) => `${item.label.trim() || "Service item"}: ₹${Number(item.amount || 0).toLocaleString("en-IN")}`);

    return [
      quoteNotes.trim(),
      lines.length ? `Spare/service items\n${lines.join("\n")}` : "",
    ].filter(Boolean).join("\n\n");
  }

  function getServiceInspectionText() {
    if (inspectTarget?.service_type === "laptop_repair") {
      return {
        issue: formatDetails("Laptop inspection", [
          ["Primary issue area", laptopInspection.issueArea],
          ["Customer issue", reportedIssue],
          ["Serial / asset tag", laptopInspection.serialNumber],
        ]) || reportedIssue,
        condition: formatDetails("Laptop diagnostics", [
          ["Power", laptopInspection.powerStatus],
          ["Boot", laptopInspection.bootStatus],
          ["Battery", laptopInspection.batteryHealth],
          ["Charger", laptopInspection.chargerStatus],
          ["Storage", laptopInspection.storageStatus],
          ["Data backup", laptopInspection.dataBackup],
          ["Physical condition", condition],
        ]) || condition,
        accessories: accessories || laptopInspection.chargerStatus || "",
        quoteNotes: formatDetails("Laptop repair plan", [
          ["Quote notes", quoteNotes],
          ["Data backup", laptopInspection.dataBackup],
          ["Parts / checks needed", laptopInspection.issueArea],
        ]) || quoteNotes,
      };
    }

    if (inspectTarget?.service_type === "cctv") {
      return {
        issue: formatDetails("CCTV site inspection", [
          ["Property type", cctvInspection.propertyType],
          ["Camera count", cctvInspection.cameraCount],
          ["Service request", reportedIssue || formatCctvBookingSelection(inspectTarget.cctv_service, inspectTarget.cctv_brand)],
        ]) || reportedIssue,
        condition: formatDetails("CCTV site readiness", [
          ["Recorder", cctvInspection.recorderType],
          ["HDD capacity", cctvInspection.hddCapacityGb ? `${cctvInspection.hddCapacityGb} GB` : ""],
          ["Storage days", cctvInspection.storageDays],
          ["Wiring route", cctvInspection.wiringRoute],
          ["Power", cctvInspection.powerAvailability],
          ["Internet/router", cctvInspection.internetStatus],
          ["Mobile viewing", cctvInspection.mobileViewing],
          ["Site access", cctvInspection.siteAccess],
          ["Mounting notes", cctvInspection.mountingNotes],
        ]) || condition,
        accessories: accessories || [cctvInspection.recorderType, cctvInspection.hddCapacityGb ? `${cctvInspection.hddCapacityGb} GB HDD` : "", cctvInspection.cameraCount ? `${cctvInspection.cameraCount} camera point(s)` : ""].filter(Boolean).join(", "),
        quoteNotes: formatDetails("CCTV installation plan", [
          ["Quote notes", quoteNotes],
          ["Wiring route", cctvInspection.wiringRoute],
          ["Mounting notes", cctvInspection.mountingNotes],
          ["Mobile viewing", cctvInspection.mobileViewing],
        ]) || quoteNotes,
      };
    }

    return {
      issue: reportedIssue,
      condition,
      accessories,
      quoteNotes,
    };
  }

  async function fetchPickupCustomerEmail(bookingId: string) {
    setPickupEmailLoading(true);
    setPickupEmailSource("manual");
    const response = await fetch(`/api/technician/pickup-agreement?bookingId=${encodeURIComponent(bookingId)}`).catch(() => null);
    const result = response ? await response.json().catch(() => null) : null;
    const email = typeof result?.email === "string" ? result.email.trim() : "";

    if (response?.ok && email) {
      patchPickupAgreement({ customerEmail: email });
      setPickupEmailSource("auto");
    } else {
      setPickupEmailSource("unavailable");
    }

    setPickupEmailLoading(false);
  }

  function openPickupAgreement() {
    if (!inspectTarget) return;

    const now = new Date();
    const expectedDrop = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const deviceLabel = inspectTarget.service_type === "cctv"
      ? formatCctvBookingSelection(inspectTarget.cctv_service, inspectTarget.cctv_brand) || formatBookingServiceType(inspectTarget.service_type)
      : [inspectTarget.brand_name, inspectTarget.model_name].filter(Boolean).join(" ") || "Device details pending";
    const address = [inspectTarget.location, inspectTarget.pincode].filter(Boolean).join(", ");

    const serviceInspection = getServiceInspectionText();
    setPickupAgreement({
      customerEmail: "",
      pickupDate: toDateInput(now),
      pickupTime: toTimeValue(now),
      dropDate: toDateInput(expectedDrop),
      dropTime: toTimeValue(expectedDrop),
      pickupPerson: inspectTarget.customer_name || "",
      pickupAddress: address,
      issue: serviceInspection.issue || quoteNotes || inspectTarget.notes || "",
      deviceCondition: serviceInspection.condition || "As inspected at pickup",
      accessories: serviceInspection.accessories || "Device only",
      estimatedQuote: quoteAmount || "",
      notes: pickupNotes || serviceInspection.quoteNotes || "Pickup required for deeper diagnosis and repair completion.",
    });
    setPickupEmailSource("manual");
    setPickupAgreementOpen(true);
    void fetchPickupCustomerEmail(inspectTarget.id);
  }

  function validatePickupAgreement() {
    if (!pickupAgreement.customerEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pickupAgreement.customerEmail.trim())) {
      toast.error("Add a valid customer email for the pickup agreement.");
      return false;
    }

    if (!pickupAgreement.pickupDate || !pickupAgreement.pickupTime || !pickupAgreement.dropDate || !pickupAgreement.dropTime) {
      toast.error("Add pickup and expected drop date/time.");
      return false;
    }

    if (!pickupAgreement.pickupPerson.trim() || !pickupAgreement.pickupAddress.trim()) {
      toast.error("Add pickup person and pickup address.");
      return false;
    }

    if (!pickupAgreement.issue.trim() || !pickupAgreement.deviceCondition.trim() || !pickupAgreement.accessories.trim()) {
      toast.error("Add issue, device condition, and accessories details.");
      return false;
    }

    return true;
  }

  async function submitPickupAgreement() {
    if (!inspectTarget || !validatePickupAgreement()) return;

    setSaving(true);
    const deviceLabel = inspectTarget.service_type === "cctv"
      ? formatCctvBookingSelection(inspectTarget.cctv_service, inspectTarget.cctv_brand) || formatBookingServiceType(inspectTarget.service_type)
      : [inspectTarget.brand_name, inspectTarget.model_name].filter(Boolean).join(" ") || "Device details pending";
    const pickupDateTime = buildDateTimeValue(pickupAgreement.pickupDate, pickupAgreement.pickupTime);
    const dropDateTime = buildDateTimeValue(pickupAgreement.dropDate, pickupAgreement.dropTime);
    const response = await fetch("/api/technician/pickup-agreement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId: inspectTarget.id,
        customerEmail: pickupAgreement.customerEmail,
        pickupDateTime,
        dropDateTime,
        pickupPerson: pickupAgreement.pickupPerson,
        pickupAddress: pickupAgreement.pickupAddress,
        issue: pickupAgreement.issue,
        deviceCondition: pickupAgreement.deviceCondition,
        accessories: pickupAgreement.accessories,
        estimatedQuote: pickupAgreement.estimatedQuote,
        notes: pickupAgreement.notes,
        serviceLabel: formatBookingServiceType(inspectTarget.service_type),
        deviceLabel,
      }),
    }).catch(() => null);
    const result = response ? await response.json().catch(() => null) : null;

    if (!response?.ok || !result?.ok) {
      setSaving(false);
      toast.error(result?.error || "Unable to send pickup agreement email.");
      return;
    }

    const agreementPickupNotes = [
      pickupAgreement.notes,
      `Pickup: ${pickupDateTime}`,
      `Expected drop: ${dropDateTime}`,
      `Handover: ${pickupAgreement.pickupPerson}`,
      `Accessories: ${pickupAgreement.accessories}`,
    ].filter(Boolean).join("\n");
    setPickupNotes(agreementPickupNotes);
    setCondition(pickupAgreement.deviceCondition);
    setAccessories(pickupAgreement.accessories);
    setReportedIssue(pickupAgreement.issue);
    setSaving(false);
    await saveInspection("pickup", {
      successMessage: "Pickup agreement emailed and order moved to pickup.",
      pickupNotesOverride: agreementPickupNotes,
      reportedIssueOverride: pickupAgreement.issue,
      conditionOverride: pickupAgreement.deviceCondition,
      accessoriesOverride: pickupAgreement.accessories,
    });
    setPickupAgreementOpen(false);
  }

  async function saveInspection(nextStatus: "inspection" | "pickup", options?: {
    successMessage?: string;
    pickupNotesOverride?: string;
    reportedIssueOverride?: string;
    conditionOverride?: string;
    accessoriesOverride?: string;
  }) {
    if (!inspectTarget) return;
    setSaving(true);
    const existing = inspectionByBooking.get(inspectTarget.id);
    const warrantyFields = buildWarrantyFields({ preset: warrantyPreset, value: warrantyValue, unit: warrantyUnit });
    const serviceInspection = getServiceInspectionText();
    const payload = {
      booking_id: inspectTarget.id,
      technician_id: user?.id,
      technician_name: user?.email,
      device_brand: inspectTarget.brand_name,
      device_model: inspectTarget.model_name,
      repair_category_id: categoryId || null,
      repair_subcategory_id: subcategoryId || null,
      reported_issue: options?.reportedIssueOverride || serviceInspection.issue || reportedIssue || null,
      issue_severity: null,
      device_condition: options?.conditionOverride || serviceInspection.condition || condition || null,
      accessories_received: options?.accessoriesOverride || serviceInspection.accessories || accessories || null,
      customer_approval: approval,
      pickup_required: true,
      pickup_notes: options?.pickupNotesOverride || pickupNotes || null,
      quote_amount: Number(quoteAmount || 0),
      quote_notes: serviceInspection.quoteNotes || quoteNotes || null,
      ...warrantyFields,
      status: nextStatus,
    };

    const result = existing
      ? await dataClient.from("booking_inspections").update(payload).eq("id", existing.id)
      : await dataClient.from("booking_inspections").insert(payload);
    if (!result.error) {
      await dataClient.from("bookings").update({ status: "in_progress", repair_category_id: categoryId || null, repair_subcategory_id: subcategoryId || null, ...warrantyFields }).eq("id", inspectTarget.id);
    }
    setSaving(false);
    if (result.error) {
      toast.error(result.error.message || "Unable to save inspection.");
      return;
    }
    toast.success(options?.successMessage || (nextStatus === "pickup" ? "Moved to pickup." : "Inspection saved."));
    setInspectTarget(null);
    loadData();
  }

  async function openFinalQuoteFromInspection() {
    if (!inspectTarget) return;

    setSaving(true);
    const existingInspection = inspectionByBooking.get(inspectTarget.id);
    const subcategory = subcategories.find((item) => item.id === subcategoryId);
    const warrantyFields = buildWarrantyFields({ preset: warrantyPreset, value: warrantyValue, unit: warrantyUnit });
    const serviceInspection = getServiceInspectionText();
    const inspectionPayload = {
      booking_id: inspectTarget.id,
      technician_id: user?.id,
      technician_name: user?.email,
      device_brand: inspectTarget.brand_name,
      device_model: inspectTarget.model_name,
      repair_category_id: categoryId || null,
      repair_subcategory_id: subcategoryId || null,
      reported_issue: serviceInspection.issue || reportedIssue || null,
      issue_severity: null,
      device_condition: serviceInspection.condition || condition || null,
      accessories_received: serviceInspection.accessories || accessories || null,
      customer_approval: approval,
      pickup_required: true,
      pickup_notes: pickupNotes || null,
      quote_amount: Number(quoteAmount || 0),
      quote_notes: serviceInspection.quoteNotes || quoteNotes || pickupNotes || null,
      ...warrantyFields,
      status: "fixed",
    };

    const inspectionResult = existingInspection
      ? await dataClient.from("booking_inspections").update(inspectionPayload).eq("id", existingInspection.id)
      : await dataClient.from("booking_inspections").insert(inspectionPayload);

    if (inspectionResult.error) {
      setSaving(false);
      toast.error(inspectionResult.error.message || "Unable to save inspection.");
      return;
    }

    setSaving(false);
    toast.success("Inspection saved. Confirm the final quote to complete.");
    setQuoteTarget(inspectTarget);
    setInspectTarget(null);
  }

  function openQuote(booking: TechBooking) {
    const inspection = inspectionByBooking.get(booking.id);
    const existingBill = billByBooking.get(booking.id);
    const initialAmount = String(existingBill?.total_amount || existingBill?.amount || inspection?.quote_amount || "");
    const initialLabel = existingBill?.description || inspection?.quote_notes || subcategories.find((item) => item.id === (inspection?.repair_subcategory_id || booking.repair_subcategory_id))?.name || "Service / spare";
    setQuoteTarget(booking);
    setQuoteAmount(initialAmount);
    setQuoteNotes(existingBill?.description || inspection?.quote_notes || "");
    setQuoteItems([createQuoteItem(initialLabel.split("\n")[0] || "Service / spare", initialAmount)]);
    setCategoryId(inspection?.repair_category_id || booking.repair_category_id || "");
    setSubcategoryId(inspection?.repair_subcategory_id || booking.repair_subcategory_id || "");
    hydrateWarranty(existingBill?.warranty_duration_value ?? inspection?.warranty_duration_value ?? booking.warranty_duration_value, existingBill?.warranty_duration_unit ?? inspection?.warranty_duration_unit ?? booking.warranty_duration_unit, existingBill?.warranty_label ?? inspection?.warranty_label ?? booking.warranty_label);
  }

  async function generateBillAndComplete() {
    if (!quoteTarget) return;
    setSaving(true);
    const inspection = inspectionByBooking.get(quoteTarget.id);
    const existingBill = billByBooking.get(quoteTarget.id);
    const subcategory = subcategories.find((item) => item.id === subcategoryId);
    const warrantyFields = buildWarrantyFields({ preset: warrantyPreset, value: warrantyValue, unit: warrantyUnit });
    const quoteTotal = getQuoteItemsTotal();
    const finalAmount = quoteTotal > 0 ? quoteTotal : Number(quoteAmount || 0);
    const description = buildQuoteDescription() || quoteNotes || subcategory?.name || "Repair service";
    const billPayload = {
      booking_id: quoteTarget.id,
      customer_name: quoteTarget.customer_name,
      customer_phone: quoteTarget.customer_phone,
      service_type: quoteTarget.service_type,
      repair_category_id: categoryId || null,
      repair_subcategory_id: subcategoryId || null,
      description,
      amount: finalAmount,
      payment_status: "paid",
      ...warrantyFields,
      created_by: user?.id || null,
    };
    const bill = existingBill?.id
      ? await dataClient.from("service_bills").update(billPayload).eq("id", existingBill.id)
      : await dataClient.from("service_bills").insert({ ...billPayload, invoice_number: "" });
    if (!bill.error) {
      if (inspection) {
        await dataClient.from("booking_inspections").update({ status: "fixed", quote_amount: finalAmount, quote_notes: description || null, ...warrantyFields }).eq("id", inspection.id);
      }
      await dataClient.from("bookings").update({ status: "completed", ...warrantyFields }).eq("id", quoteTarget.id);
    }
    setSaving(false);
    if (bill.error) {
      toast.error(bill.error.message || "Unable to generate bill.");
      return;
    }
    toast.success(existingBill ? "Bill updated and order completed." : "Bill generated and order completed.");
    setQuoteTarget(null);
    loadData();
  }

  if (loading || !user || !hasRole) {
    return <main className="min-h-screen bg-background" />;
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-base font-black text-foreground">Technician Dashboard</div>
            <div className="truncate text-[11px] text-muted-foreground">{user.email}</div>
          </div>
          <div ref={profileMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setProfileMenuOpen((open) => !open)}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-2 py-1.5 text-left shadow-sm transition-colors hover:border-primary/30 hover:bg-secondary"
              aria-expanded={profileMenuOpen}
              aria-haspopup="menu"
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserCircle className="size-5" />
              </span>
              <span className="hidden min-w-0 sm:block">
                <span className="block text-xs font-black text-foreground">Profile</span>
                <span className={`block text-[10px] font-bold ${alertsActive ? "text-emerald-600" : notificationPermission === "denied" ? "text-rose-600" : "text-amber-600"}`}>{alertButtonLabel}</span>
              </span>
              <ChevronDown className={`size-4 text-muted-foreground transition-transform ${profileMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {profileMenuOpen ? (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-72 overflow-hidden rounded-2xl border border-border bg-card p-2 text-sm shadow-xl"
              >
                <div className="border-b border-border px-3 py-3">
                  <div className="text-xs font-black text-foreground">Technician</div>
                  <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{user.email}</div>
                </div>
                <div className="py-2">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      void enableOrderAlerts();
                    }}
                    title={alertButtonLabel}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-black text-foreground transition-colors hover:bg-secondary"
                  >
                    <span className={`flex size-8 items-center justify-center rounded-full ${alertsActive ? "bg-emerald-50 text-emerald-700" : notificationPermission === "denied" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>
                      {alertsActive ? <Bell className="size-4" /> : <Volume2 className="size-4" />}
                    </span>
                    <span>
                      <span className="block">{alertButtonLabel}</span>
                      <span className="block text-[10px] font-bold text-muted-foreground">Lead assignment siren and browser notifications</span>
                    </span>
                  </button>
                  <InstallAppButton menuItem />
                </div>
                <div className="border-t border-border pt-2">
                  <button onClick={handleSignOut} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-black text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                    <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                      <LogOut className="size-4" />
                    </span>
                    Logout
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div className="container max-w-4xl py-5">
        <div className="grid grid-cols-4 gap-2">
          {[
            { id: "orders", label: "Orders", icon: ClipboardCheck },
            { id: "pickup", label: "Pickup", icon: Bike },
            { id: "fixed", label: "Fixed", icon: CheckCircle2 },
            { id: "earnings", label: "Earning", icon: IndianRupee },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeView === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveView(tab.id as typeof activeView)} className={`rounded-2xl border p-3 text-xs font-black ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground"}`}>
                <Icon className="mx-auto mb-1 size-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder={activeView === "earnings" ? "Search invoice, customer, order, or service" : "Search customer, order, phone, or location"} />
        </div>

        {loadingData ? (
          <div className="mt-5 flex justify-center rounded-2xl border border-border bg-card py-12"><Loader2 className="size-5 animate-spin text-primary" /></div>
        ) : activeView === "earnings" ? (
          <div className="mt-5 space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "Today's earning", value: money(todayEarning), icon: IndianRupee },
                { label: "Paid bills", value: paidTechnicianBills.length, icon: CreditCard },
                { label: "Pending collection", value: money(pendingCollection), icon: ReceiptText },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">{stat.label}</div>
                      <Icon className="size-4 text-primary" />
                    </div>
                    <div className="mt-2 text-2xl font-black text-foreground">{stat.value}</div>
                  </div>
                );
              })}
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-black text-foreground">Earning history</div>
                  <div className="text-xs text-muted-foreground">Total paid collection: {money(totalEarning)}</div>
                </div>
                <select value={earningStatusFilter} onChange={(event) => setEarningStatusFilter(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground">
                  <option value="all">All statuses</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="partial">Partial</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            {filteredEarningBills.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-12 text-center">
                <ReceiptText className="mx-auto mb-2 size-8 text-muted-foreground/40" />
                <p className="text-sm font-bold text-foreground">No earnings found</p>
                <p className="mt-1 text-xs text-muted-foreground">Paid and unpaid bills for your assigned orders will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEarningBills.map((bill) => {
                  const booking = bill.booking_id ? bookingById.get(bill.booking_id) : undefined;
                  return (
                    <div key={bill.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">{bill.invoice_number || booking?.booking_code || "Bill"}</span>
                            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${bill.payment_status === "paid" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>{bill.payment_status}</span>
                          </div>
                          <div className="mt-2 text-sm font-black text-foreground">{bill.customer_name || booking?.customer_name || "Customer"}</div>
                          <div className="text-xs text-muted-foreground">{formatBookingServiceType(bill.service_type || booking?.service_type || "")}{bill.description ? ` - ${bill.description}` : ""}</div>
                          {(bill.warranty_label || booking?.warranty_label) ? <div className="mt-2 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700">{bill.warranty_label || booking?.warranty_label}</div> : null}
                          <div className="mt-1 text-[11px] text-muted-foreground">{bill.created_at ? new Date(bill.created_at).toLocaleString("en-IN") : "No date"}</div>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="text-right">
                            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Amount</div>
                            <div className="text-lg font-black text-foreground">{money(bill.total_amount || bill.amount || 0)}</div>
                          </div>
                          <button type="button" onClick={() => handleDownloadInvoice(bill, booking)} className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary" title="Download invoice PDF" aria-label="Download invoice PDF">
                            <Download className="size-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : visibleBookings.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-border bg-card px-5 py-12 text-center">
            <Wrench className="mx-auto mb-2 size-8 text-muted-foreground/40" />
            <p className="text-sm font-bold text-foreground">No orders in this section</p>
            <p className="mt-1 text-xs text-muted-foreground">Assigned orders will appear here after operations dispatches them.</p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {visibleBookings.map((booking) => {
              const inspection = inspectionByBooking.get(booking.id);
              const bill = billByBooking.get(booking.id);
              const milestone = getMilestone(booking, inspection);
              const closed = isClosedOrder(booking);
              const canEditInspection = Boolean(inspection) && !closed && booking.status !== "completed" && inspection?.status !== "fixed";
              const canQuote = !closed && booking.status !== "completed" && inspection?.status === "pickup";
              return (
                <div key={booking.id} className={`rounded-2xl border p-4 shadow-sm transition-colors ${closed ? "border-border/60 bg-muted/50 opacity-70 grayscale" : "border-border bg-card"}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">{booking.booking_code || "Order"}</span>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusStyles[booking.status] || "border-border bg-secondary text-foreground"}`}>{inspection?.status || formatBookingStatus(booking.status)}</span>
                    {bill?.payment_status ? <span className="rounded-full border border-border bg-secondary px-2.5 py-1 text-[11px] font-bold text-foreground">{bill.payment_status}</span> : null}
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-1.5">
                    {milestoneLabels.map((label, index) => (
                      <div key={label} className={`rounded-full px-2 py-1 text-center text-[10px] font-black ${index <= milestone ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>{label}</div>
                    ))}
                  </div>
                  <div className="mt-3 text-lg font-black text-foreground">{booking.customer_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatBookingServiceType(booking.service_type)} • {booking.service_type === "cctv" ? formatCctvBookingSelection(booking.cctv_service, booking.cctv_brand) || "CCTV details pending" : [booking.brand_name, booking.model_name].filter(Boolean).join(" ") || "Device details pending"}
                  </div>
                  {(bill?.warranty_label || inspection?.warranty_label || booking.warranty_label) ? (
                    <div className="mt-2 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700">{bill?.warranty_label || inspection?.warranty_label || booking.warranty_label}</div>
                  ) : null}
                  <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                    <a href={`tel:${booking.customer_phone}`} className="inline-flex items-center gap-2 rounded-xl bg-secondary px-3 py-2 font-bold text-foreground"><Phone className="size-3.5" />{booking.customer_phone}</a>
                    {inspection ? (
                      <a href={getNavigationUrl(booking)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-sky-100 px-3 py-2 font-black text-sky-700 transition-colors hover:bg-sky-200"><Navigation className="size-3.5" />Navigate to location</a>
                    ) : (
                      <div className="inline-flex items-center gap-2 rounded-xl bg-secondary px-3 py-2 font-bold text-muted-foreground"><Navigation className="size-3.5" />Accept to navigate</div>
                    )}
                  </div>
                  <div className="mt-2 inline-flex items-start gap-2 rounded-xl bg-secondary/70 px-3 py-2 text-xs text-muted-foreground"><MapPin className="mt-0.5 size-3.5" />{booking.location || "No location"}</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {!inspection && !closed ? (
                      <button onClick={() => acceptOrder(booking)} className="rounded-xl bg-primary px-4 py-2.5 text-xs font-black text-primary-foreground">Accept</button>
                    ) : null}
                    {canEditInspection ? <button onClick={() => openInspection(booking)} className="rounded-xl border border-border px-4 py-2.5 text-xs font-black text-foreground hover:border-primary/30 hover:text-primary">Inspect</button> : null}
                    {canQuote ? (
                      <button onClick={() => openQuote(booking)} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white">Quote and complete</button>
                    ) : null}
                    {bill ? (
                      <button type="button" onClick={() => handleDownloadInvoice(bill, booking)} className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-xs font-black text-foreground hover:border-primary/30 hover:text-primary" title="Download invoice PDF">
                        <Download className="size-3.5" />
                        Invoice
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {assignmentAlert ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-red-300 bg-red-600 p-5 text-center text-white shadow-2xl">
            <button
              type="button"
              onClick={() => setAssignmentAlert(null)}
              className="ml-auto flex rounded-full bg-white/15 p-2 text-white transition-colors hover:bg-white/25"
              aria-label="Dismiss order alert"
            >
              <X className="size-4" />
            </button>
            <div className="mx-auto mt-1 flex size-16 items-center justify-center rounded-full bg-white/20 text-white ring-4 ring-white/20">
              <Bell className="size-7" />
            </div>
            <h2 className="mt-4 text-2xl font-semibold leading-tight">New order assigned</h2>
            <p className="mt-2 text-sm font-bold text-white/80">{assignmentAlert.booking_code || "Open your orders"}</p>
            <div className="mt-4 rounded-2xl bg-white/15 p-3">
              <div className="flex items-center justify-between text-xs font-black uppercase tracking-[0.14em] text-white/80">
                <span>Alert timer</span>
                <span>{assignmentAlertSeconds}s</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-white transition-all duration-1000"
                  style={{ width: `${Math.max((assignmentAlertSeconds / ASSIGNMENT_SIREN_SECONDS) * 100, 0)}%` }}
                />
              </div>
            </div>
            <div className="mt-5 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setAssignmentAlert(null);
                  setActiveView("orders");
                  router.push(TECHNICIAN_DASHBOARD_PATH);
                }}
                className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-black text-red-700"
              >
                Open orders
              </button>
              <button
                type="button"
                onClick={() => setAssignmentAlert(null)}
                className="w-full rounded-2xl border border-white/30 px-4 py-3 text-sm font-black text-white"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {inspectTarget ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" onClick={() => setInspectTarget(null)}>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-border bg-card p-4 shadow-xl sm:max-w-2xl sm:rounded-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-foreground">Inspect device</h2>
              <p className="text-xs text-muted-foreground">
                {inspectTarget.service_type === "cctv"
                  ? formatCctvBookingSelection(inspectTarget.cctv_service, inspectTarget.cctv_brand) || "CCTV site"
                  : `${inspectTarget.brand_name} ${inspectTarget.model_name}`.trim() || formatBookingServiceType(inspectTarget.service_type)} • {inspectTarget.customer_name}
              </p>
            </div>
            <div className="mb-4 grid grid-cols-3 gap-2 rounded-2xl bg-secondary/50 p-2">
              {["Issue", "Pickup", "Quote"].map((label, index) => (
                <div key={label} className={`rounded-xl px-3 py-2 text-center text-xs font-black ${index === 0 ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>{label}</div>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {inspectTarget.service_type !== "cctv" ? (
                <>
                  <label htmlFor="field-techniciandashboardclient-1086" className="space-y-1">
                    <span className="text-xs font-bold text-muted-foreground">Brand</span>
                    <Input id="field-techniciandashboardclient-1086" value={getLaptopBookingDetails(inspectTarget).brand || "Customer brand pending"} readOnly />
                  </label>
                  <label htmlFor="field-techniciandashboardclient-1090" className="space-y-1">
                    <span className="text-xs font-bold text-muted-foreground">Model</span>
                    <Input id="field-techniciandashboardclient-1090" value={inspectTarget.model_name || (inspectTarget.service_type === "laptop_repair" ? "Model to confirm at inspection" : "Customer model pending")} readOnly />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-bold text-muted-foreground">Issue category</span>
                    <select value={categoryId} onChange={(event) => { setCategoryId(event.target.value); setSubcategoryId(""); }} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                      <option value="">Select category</option>
                      {selectedCategoryOptions.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-bold text-muted-foreground">Issue subcategory</span>
                    <select value={subcategoryId} onChange={(event) => { setSubcategoryId(event.target.value); const sub = subcategories.find((item) => item.id === event.target.value); if (sub?.price && !quoteAmount) setQuoteAmount(String(sub.price)); }} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                      <option value="">Select issue</option>
                      {selectedSubcategoryOptions.map((subcategory) => <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>)}
                    </select>
                  </label>
                </>
              ) : null}
              {inspectTarget.service_type === "laptop_repair" ? (
                <div className="grid gap-3 rounded-2xl border border-violet-100 bg-violet-50/60 p-3 sm:col-span-2 sm:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-xs font-bold text-violet-700">Primary laptop issue</span>
                    <select value={laptopInspection.issueArea} onChange={(event) => patchLaptopInspection({ issueArea: event.target.value })} className="h-10 w-full rounded-md border border-violet-200 bg-background px-3 text-sm">
                      <option value="">Select issue area</option>
                      {laptopIssueAreas.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-bold text-violet-700">Serial / asset tag</span>
                    <Input value={laptopInspection.serialNumber} onChange={(event) => patchLaptopInspection({ serialNumber: event.target.value })} placeholder="Optional serial or asset tag" />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-bold text-violet-700">Power status</span>
                    <Input value={laptopInspection.powerStatus} onChange={(event) => patchLaptopInspection({ powerStatus: event.target.value })} placeholder="No power, charging, adapter LED" />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-bold text-violet-700">Boot / OS status</span>
                    <Input value={laptopInspection.bootStatus} onChange={(event) => patchLaptopInspection({ bootStatus: event.target.value })} placeholder="Boots, BIOS, Windows error, blank screen" />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-bold text-violet-700">Battery health</span>
                    <Input value={laptopInspection.batteryHealth} onChange={(event) => patchLaptopInspection({ batteryHealth: event.target.value })} placeholder="Backup time, swelling, not detected" />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-bold text-violet-700">Charger / accessories</span>
                    <Input value={laptopInspection.chargerStatus} onChange={(event) => patchLaptopInspection({ chargerStatus: event.target.value })} placeholder="Original charger, adapter condition" />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-bold text-violet-700">Storage / data</span>
                    <Input value={laptopInspection.storageStatus} onChange={(event) => patchLaptopInspection({ storageStatus: event.target.value })} placeholder="SSD/HDD detected, data risk" />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-bold text-violet-700">Data backup instruction</span>
                    <Input value={laptopInspection.dataBackup} onChange={(event) => patchLaptopInspection({ dataBackup: event.target.value })} placeholder="Backup required, customer approved, not required" />
                  </label>
                </div>
              ) : null}
              {inspectTarget.service_type === "cctv" ? (
                <div className="grid gap-3 rounded-2xl border border-sky-100 bg-sky-50/70 p-3 sm:col-span-2 sm:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-xs font-bold text-sky-700">Property type</span>
                    <select value={cctvInspection.propertyType} onChange={(event) => patchCctvInspection({ propertyType: event.target.value })} className="h-10 w-full rounded-md border border-sky-200 bg-background px-3 text-sm">
                      <option value="">Select property</option>
                      {cctvPropertyTypes.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-bold text-sky-700">Camera points</span>
                    <Input type="number" min="1" value={cctvInspection.cameraCount} onChange={(event) => patchCctvInspection({ cameraCount: event.target.value })} placeholder="Number of cameras" />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-bold text-sky-700">Recorder / setup</span>
                    <select value={cctvInspection.recorderType} onChange={(event) => patchCctvInspection({ recorderType: event.target.value })} className="h-10 w-full rounded-md border border-sky-200 bg-background px-3 text-sm">
                      <option value="">Select recorder</option>
                      {recorderTypes.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-bold text-sky-700">Storage days</span>
                    <Input value={cctvInspection.storageDays} onChange={(event) => patchCctvInspection({ storageDays: event.target.value })} placeholder="7 days, 15 days, 30 days" />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-bold text-sky-700">Hard drive size</span>
                    <div className="grid grid-cols-[1fr_48px] gap-2">
                      <Input type="number" min="0" value={cctvInspection.hddCapacityGb} onChange={(event) => patchCctvInspection({ hddCapacityGb: event.target.value })} placeholder="500, 1000, 2000" />
                      <div className="flex h-10 items-center justify-center rounded-md border border-sky-200 bg-background text-xs font-black text-sky-700">GB</div>
                    </div>
                  </label>
                  <label className="space-y-1 sm:col-span-2">
                    <span className="text-xs font-bold text-sky-700">Wiring route</span>
                    <Input value={cctvInspection.wiringRoute} onChange={(event) => patchCctvInspection({ wiringRoute: event.target.value })} placeholder="Concealed/open wiring, cable path, height" />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-bold text-sky-700">Power availability</span>
                    <Input value={cctvInspection.powerAvailability} onChange={(event) => patchCctvInspection({ powerAvailability: event.target.value })} placeholder="Nearby power points, UPS needed" />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-bold text-sky-700">Internet/router</span>
                    <Input value={cctvInspection.internetStatus} onChange={(event) => patchCctvInspection({ internetStatus: event.target.value })} placeholder="Router location, bandwidth, LAN" />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-bold text-sky-700">Mobile viewing</span>
                    <Input value={cctvInspection.mobileViewing} onChange={(event) => patchCctvInspection({ mobileViewing: event.target.value })} placeholder="Required, customer phone/app ready" />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-bold text-sky-700">Site access</span>
                    <Input value={cctvInspection.siteAccess} onChange={(event) => patchCctvInspection({ siteAccess: event.target.value })} placeholder="Ladder, roof, permission, timing" />
                  </label>
                  <label className="space-y-1 sm:col-span-2">
                    <span className="text-xs font-bold text-sky-700">Mounting notes</span>
                    <textarea value={cctvInspection.mountingNotes} onChange={(event) => patchCctvInspection({ mountingNotes: event.target.value })} rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Angles, blind spots, DVR/NVR location, material required" />
                  </label>
                </div>
              ) : null}
              <label className="space-y-1 sm:col-span-2">
                <span className="text-xs font-bold text-muted-foreground">Main issue notes</span>
                <textarea value={reportedIssue} onChange={(event) => setReportedIssue(event.target.value)} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="What customer reported, what you observed, tests done" />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground">Customer approval</span>
                <select value={approval} onChange={(event) => setApproval(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="declined">Declined</option>
                </select>
              </label>
              <label htmlFor="field-techniciandashboardclient-1120" className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground">Device condition</span>
                <Input id="field-techniciandashboardclient-1120" value={condition} onChange={(event) => setCondition(event.target.value)} placeholder="Cracks, dents, water mark, powers on" />
              </label>
              <label htmlFor="field-techniciandashboardclient-1124" className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground">Accessories received</span>
                <Input id="field-techniciandashboardclient-1124" value={accessories} onChange={(event) => setAccessories(event.target.value)} placeholder="Charger, box, case, none" />
              </label>
              <label htmlFor="field-techniciandashboardclient-1128" className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground">Estimated quote</span>
                <Input id="field-techniciandashboardclient-1128" type="number" value={quoteAmount} onChange={(event) => setQuoteAmount(event.target.value)} placeholder="Amount" />
              </label>
              <label htmlFor="field-techniciandashboardclient-1132" className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground">Quote notes</span>
                <Input id="field-techniciandashboardclient-1132" value={quoteNotes} onChange={(event) => setQuoteNotes(event.target.value)} placeholder="Parts, service scope, warranty note" />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground">Warranty</span>
                <select value={warrantyPreset} onChange={(event) => setWarrantyPreset(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  {WARRANTY_PRESETS.map((preset) => <option key={preset.value} value={preset.value}>{preset.label}</option>)}
                </select>
              </label>
              {warrantyPreset === "custom" ? (
                <div className="grid grid-cols-[1fr_130px] gap-2">
                  <label className="space-y-1">
                    <span className="text-xs font-bold text-muted-foreground">Duration</span>
                    <Input type="number" min="1" value={warrantyValue} onChange={(event) => setWarrantyValue(event.target.value)} placeholder="30" />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-bold text-muted-foreground">Unit</span>
                    <select value={warrantyUnit} onChange={(event) => setWarrantyUnit(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                      {WARRANTY_UNITS.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                    </select>
                  </label>
                </div>
              ) : null}
              <label className="space-y-1 sm:col-span-2">
                <span className="text-xs font-bold text-muted-foreground">Pickup notes</span>
                <textarea value={pickupNotes} onChange={(event) => setPickupNotes(event.target.value)} rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Pickup handover notes, quote condition, parts required" />
              </label>
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button onClick={() => setInspectTarget(null)} className="rounded-xl border border-border px-4 py-2.5 text-xs font-black">Cancel</button>
              <button onClick={() => saveInspection("inspection")} disabled={saving} className="rounded-xl border border-primary/30 px-4 py-2.5 text-xs font-black text-primary disabled:opacity-60">Save inspection</button>
              <button onClick={openPickupAgreement} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-black text-primary-foreground disabled:opacity-60">
                <CalendarClock className="size-4" />
                Move to pickup
              </button>
              <button onClick={openFinalQuoteFromInspection} disabled={saving} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white disabled:opacity-60">Quote and complete</button>
            </div>
          </div>
        </div>
      ) : null}

      {inspectTarget && pickupAgreementOpen ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center" onClick={() => setPickupAgreementOpen(false)}>
          <div className="fixed inset-0 bg-black/45 backdrop-blur-sm" />
          <div className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-border bg-card p-3 shadow-2xl sm:max-w-md sm:rounded-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-primary">
                  <Mail className="size-3" />
                  Pickup agreement
                </div>
                <h2 className="mt-2 text-base font-black leading-tight text-foreground">Confirm pickup details</h2>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{inspectTarget.booking_code || "Order"} - {inspectTarget.customer_name}</p>
              </div>
              <button type="button" onClick={() => setPickupAgreementOpen(false)} className="rounded-full border border-border p-2 text-muted-foreground hover:text-foreground" aria-label="Close pickup agreement">
                <X className="size-4" />
              </button>
            </div>

            <div className="mb-3 grid grid-cols-2 gap-2 rounded-xl bg-secondary/70 p-2 text-[11px]">
              <div>
                <div className="font-black text-muted-foreground">Customer</div>
                <div className="truncate font-bold text-foreground">{inspectTarget.customer_name}</div>
                <div className="truncate text-muted-foreground">{inspectTarget.customer_phone}</div>
              </div>
              <div>
                <div className="font-black text-muted-foreground">Issue</div>
                <div className="line-clamp-2 font-bold text-foreground">{pickupAgreement.issue || "Issue pending"}</div>
              </div>
            </div>

            <div className="grid gap-2">
              <label className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-black text-muted-foreground">Customer email</span>
                  <span className={`text-[10px] font-black ${pickupEmailSource === "auto" ? "text-emerald-600" : "text-muted-foreground"}`}>
                    {pickupEmailLoading ? "Fetching..." : pickupEmailSource === "auto" ? "Auto-filled" : "Manual"}
                  </span>
                </div>
                <Input type="email" value={pickupAgreement.customerEmail} onChange={(event) => { patchPickupAgreement({ customerEmail: event.target.value }); setPickupEmailSource("manual"); }} placeholder={pickupEmailLoading ? "Fetching customer email..." : "customer@example.com"} />
              </label>
              <div className="grid gap-2">
                <div className="rounded-xl border border-border bg-background p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[11px] font-black text-muted-foreground">Pickup schedule</div>
                      <div className="text-xs font-black text-foreground">{formatDateLabel(pickupAgreement.pickupDate)} at {pickupTimeOptions.find((option) => option.value === pickupAgreement.pickupTime)?.label || "Select time"}</div>
                    </div>
                    <CalendarClock className="size-4 text-primary" />
                  </div>
                  <div className="mt-2 grid grid-cols-[1fr_128px] gap-2">
                    <Input type="date" value={pickupAgreement.pickupDate} onChange={(event) => patchPickupAgreement({ pickupDate: event.target.value })} />
                    <select value={pickupAgreement.pickupTime} onChange={(event) => patchPickupAgreement({ pickupTime: event.target.value })} className="h-10 rounded-md border border-input bg-background px-2 text-xs font-bold">
                      {pickupTimeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </div>
                  <div className="mt-2 flex gap-1.5">
                    <button type="button" onClick={() => patchPickupAgreement({ pickupDate: toDateInput(new Date()) })} className="rounded-lg bg-secondary px-2 py-1 text-[10px] font-black text-foreground">Today</button>
                    <button type="button" onClick={() => patchPickupAgreement({ pickupDate: toDateInput(new Date(Date.now() + 24 * 60 * 60 * 1000)) })} className="rounded-lg bg-secondary px-2 py-1 text-[10px] font-black text-foreground">Tomorrow</button>
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-background p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[11px] font-black text-muted-foreground">Expected drop schedule</div>
                      <div className="text-xs font-black text-foreground">{formatDateLabel(pickupAgreement.dropDate)} at {pickupTimeOptions.find((option) => option.value === pickupAgreement.dropTime)?.label || "Select time"}</div>
                    </div>
                    <Bike className="size-4 text-primary" />
                  </div>
                  <div className="mt-2 grid grid-cols-[1fr_128px] gap-2">
                    <Input type="date" value={pickupAgreement.dropDate} onChange={(event) => patchPickupAgreement({ dropDate: event.target.value })} />
                    <select value={pickupAgreement.dropTime} onChange={(event) => patchPickupAgreement({ dropTime: event.target.value })} className="h-10 rounded-md border border-input bg-background px-2 text-xs font-bold">
                      {pickupTimeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </div>
                  <div className="mt-2 flex gap-1.5">
                    <button type="button" onClick={() => patchPickupAgreement({ dropDate: toDateInput(new Date(Date.now() + 24 * 60 * 60 * 1000)) })} className="rounded-lg bg-secondary px-2 py-1 text-[10px] font-black text-foreground">Tomorrow</button>
                    <button type="button" onClick={() => patchPickupAgreement({ dropDate: toDateInput(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)) })} className="rounded-lg bg-secondary px-2 py-1 text-[10px] font-black text-foreground">Day after</button>
                  </div>
                </div>
              </div>
              <label className="space-y-1">
                <span className="text-[11px] font-black text-muted-foreground">Pickup handover person</span>
                <Input value={pickupAgreement.pickupPerson} onChange={(event) => patchPickupAgreement({ pickupPerson: event.target.value })} placeholder="Customer or receiver name" />
              </label>
              <label className="space-y-1">
                <span className="text-[11px] font-black text-muted-foreground">Pickup address</span>
                <textarea value={pickupAgreement.pickupAddress} onChange={(event) => patchPickupAgreement({ pickupAddress: event.target.value })} rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Full pickup address" />
              </label>
              <label className="space-y-1">
                <span className="text-[11px] font-black text-muted-foreground">Issue confirmed at pickup</span>
                <textarea value={pickupAgreement.issue} onChange={(event) => patchPickupAgreement({ issue: event.target.value })} rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Customer reported issue and technician observation" />
              </label>
              <label className="space-y-1">
                <span className="text-[11px] font-black text-muted-foreground">Device condition</span>
                <Input value={pickupAgreement.deviceCondition} onChange={(event) => patchPickupAgreement({ deviceCondition: event.target.value })} placeholder="Cracks, dents, powers on, lock status" />
              </label>
              <div className="grid grid-cols-[1fr_120px] gap-2">
                <label className="space-y-1">
                  <span className="text-[11px] font-black text-muted-foreground">Accessories received</span>
                  <Input value={pickupAgreement.accessories} onChange={(event) => patchPickupAgreement({ accessories: event.target.value })} placeholder="Device only, charger, box" />
                </label>
                <label className="space-y-1">
                  <span className="text-[11px] font-black text-muted-foreground">Estimate</span>
                  <Input type="number" value={pickupAgreement.estimatedQuote} onChange={(event) => patchPickupAgreement({ estimatedQuote: event.target.value })} placeholder="Amount" />
                </label>
              </div>
              <label className="space-y-1">
                <span className="text-[11px] font-black text-muted-foreground">Agreement notes</span>
                <textarea value={pickupAgreement.notes} onChange={(event) => patchPickupAgreement({ notes: event.target.value })} rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Testing, data, approval, pickup proof, special handling" />
              </label>
            </div>

            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] font-bold leading-5 text-amber-800">
              Email subject: Looplic Pickup agreement. A PDF agreement will be attached to the customer email before the order moves to Pickup.
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setPickupAgreementOpen(false)} className="rounded-xl border border-border px-4 py-2.5 text-xs font-black text-foreground">Back</button>
              <button type="button" onClick={submitPickupAgreement} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-black text-primary-foreground disabled:opacity-60">
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
                Send and move
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {quoteTarget ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" onClick={() => setQuoteTarget(null)}>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full rounded-t-3xl border border-border bg-card p-4 shadow-xl sm:max-w-md sm:rounded-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-foreground">Quote and complete</h2>
              <p className="text-xs text-muted-foreground">{quoteTarget.customer_name} • {quoteTarget.booking_code}</p>
            </div>
            <div className="space-y-3">
              <label className="space-y-1 block">
                <span className="text-xs font-bold text-muted-foreground">Final service notes</span>
                <textarea value={quoteNotes} onChange={(event) => setQuoteNotes(event.target.value)} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Services added, parts used, warranty notes" />
              </label>
              <div className="rounded-2xl border border-border bg-secondary/30 p-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">Spares and service</div>
                    <div className="mt-1 text-lg font-black text-foreground">₹{getQuoteItemsTotal().toLocaleString("en-IN")}</div>
                  </div>
                  <button type="button" onClick={addQuoteItem} className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-black text-primary-foreground">
                    <Plus className="size-3.5" />
                    Add
                  </button>
                </div>
                <div className="space-y-2">
                  {quoteItems.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-[1fr_104px_34px] gap-2">
                      <Input value={item.label} onChange={(event) => patchQuoteItem(item.id, { label: event.target.value })} placeholder={`Spare/service ${index + 1}`} />
                      <Input type="number" value={item.amount} onChange={(event) => patchQuoteItem(item.id, { amount: event.target.value })} placeholder="Amount" />
                      <button type="button" onClick={() => removeQuoteItem(item.id)} disabled={quoteItems.length <= 1} className="inline-flex h-10 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-destructive disabled:opacity-40" aria-label="Remove spare item">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-3 rounded-xl bg-background px-3 py-2 text-[11px] font-bold text-muted-foreground">
                  Add display, adapter, HDD, cable, camera, labor, visit charge, or any spare used. These lines will be printed in the invoice PDF.
                </div>
              </div>
              <label className="space-y-1 block">
                <span className="text-xs font-bold text-muted-foreground">Warranty</span>
                <select value={warrantyPreset} onChange={(event) => setWarrantyPreset(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  {WARRANTY_PRESETS.map((preset) => <option key={preset.value} value={preset.value}>{preset.label}</option>)}
                </select>
              </label>
              {warrantyPreset === "custom" ? (
                <div className="grid grid-cols-[1fr_130px] gap-2">
                  <label className="space-y-1">
                    <span className="text-xs font-bold text-muted-foreground">Duration</span>
                    <Input type="number" min="1" value={warrantyValue} onChange={(event) => setWarrantyValue(event.target.value)} placeholder="30" />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-bold text-muted-foreground">Unit</span>
                    <select value={warrantyUnit} onChange={(event) => setWarrantyUnit(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                      {WARRANTY_UNITS.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                    </select>
                  </label>
                </div>
              ) : null}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setQuoteTarget(null)} className="rounded-xl border border-border px-4 py-2.5 text-xs font-black">Cancel</button>
              <button onClick={generateBillAndComplete} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white disabled:opacity-60">
                <ReceiptText className="size-4" />
                Complete order
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
