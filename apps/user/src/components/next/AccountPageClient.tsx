"use client";

import type { AppUser } from "@/src/hooks/useRoleSession";
import {
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  Loader2,
  LogOut,
  MapPin,
  Package,
  PencilLine,
  Phone,
  Save,
  Search,
  ShieldCheck,
  User,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { formatCctvBookingSelection, isValidPhoneNumber, isValidPincode, type BookingRow } from "@/src/lib/bookings";
import { downloadInvoicePdf } from "@/src/lib/invoice-pdf";
import { buildCustomerProfileInsert, type CustomerProfile } from "@/src/lib/profile";
import { createClient } from "@/src/lib/data-client/client";

type AccountBill = {
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
  payment_status: string | null;
  payment_mode: string | null;
  notes: string | null;
  warranty_duration_value?: number | null;
  warranty_duration_unit?: string | null;
  warranty_label?: string | null;
  created_at: string | null;
};

type AccountBooking = {
  booking_code: string | null;
  id: string;
  service_type: string;
  cctv_service: string | null;
  cctv_brand: string | null;
  guard_type: string | null;
  status: string;
  created_at: string;
  location: string | null;
  scheduled_date: string | null;
  time_slot: string | null;
  model_id: string | null;
  repair_category_id: string | null;
  repair_subcategory_id: string | null;
  notes: string | null;
  pincode: string | null;
  model_name: string;
  brand_name: string;
  repair_category_name: string;
  repair_subcategory_name: string;
  invoice: AccountBill | null;
};

const statusTabs = [
  { id: "all", label: "All Orders", icon: Package },
  { id: "pending", label: "Booked", icon: CalendarCheck },
  { id: "confirmed", label: "Confirmed", icon: ShieldCheck },
  { id: "in_progress", label: "In Progress", icon: Clock3 },
  { id: "completed", label: "Completed", icon: CheckCircle2 },
  { id: "cancelled", label: "Cancelled", icon: XCircle },
] as const;

const statusColors: Record<string, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  confirmed: "border-sky-200 bg-sky-50 text-sky-800",
  in_progress: "border-violet-200 bg-violet-50 text-violet-800",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  cancelled: "border-rose-200 bg-rose-50 text-rose-800",
};

type ProfileFormState = {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
};

function createProfileForm(profile: CustomerProfile | null, user: AppUser | null): ProfileFormState {
  return {
    fullName: profile?.full_name || user?.user_metadata?.full_name || "",
    phone: profile?.phone || "",
    address: profile?.address || "",
    city: profile?.city || "",
    pincode: profile?.pincode || "",
  };
}

function formatServiceType(serviceType: string) {
  if (serviceType === "screen_guard") return "Device Service";
  if (serviceType === "mobile_repair") return "Mobile Repair";
  if (serviceType === "laptop_repair") return "Laptop Repair";
  if (serviceType === "cctv") return "CCTV Installation";
  return serviceType.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function getBookingTitle(booking: AccountBooking) {
  if (booking.service_type === "cctv") {
    return formatCctvBookingSelection(booking.cctv_service, booking.cctv_brand) || "CCTV booking";
  }

  const title = [booking.brand_name, booking.model_name].filter(Boolean).join(" ");
  return title || "Device booking";
}

function getBookingDescriptor(booking: AccountBooking) {
  if (booking.service_type === "cctv") {
    return "CCTV Installation";
  }

  if (booking.service_type === "screen_guard") {
    return booking.guard_type ? `Device Service • ${booking.guard_type}` : "Device Service";
  }

  if (booking.repair_subcategory_name) {
    return `${formatServiceType(booking.service_type)} • ${booking.repair_subcategory_name}`;
  }

  if (booking.repair_category_name) {
    return `${formatServiceType(booking.service_type)} • ${booking.repair_category_name}`;
  }

  return formatServiceType(booking.service_type);
}

function canCancelBooking(booking: AccountBooking) {
  return booking.status === "pending";
}

function canDownloadInvoice(booking: AccountBooking) {
  return booking.status === "completed" && Boolean(booking.invoice?.id);
}

export function AccountPageClient({ buybackOrders }: { buybackOrders?: React.ReactNode }) {
  const router = useRouter();
  const dataClient = createClient();
  const [user, setUser] = useState<AppUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [bookings, setBookings] = useState<AccountBooking[]>([]);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [profileForm, setProfileForm] = useState<ProfileFormState>(createProfileForm(null, null));
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [cancelingBookingId, setCancelingBookingId] = useState<string | null>(null);
  const [bookingActionError, setBookingActionError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadUser() {
      const {
        data: { session },
      } = await dataClient.auth.getSession();
      const currentUser = session?.user ?? null;

      if (ignore) {
        return;
      }

      if (!currentUser) {
        router.replace("/auth?redirect=/account");
        return;
      }

      setUser(currentUser);
      setLoadingUser(false);
    }

    loadUser();

    const {
      data: { subscription },
    } = dataClient.auth.onAuthStateChange((_event, session) => {
      if (ignore) {
        return;
      }

      const currentUser = session?.user ?? null;
      if (!currentUser) {
        router.replace("/auth?redirect=/account");
        return;
      }

      setUser(currentUser);
      setLoadingUser(false);
    });

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, [router, dataClient.auth]);

  useEffect(() => {
    let ignore = false;

    async function loadBookings() {
      if (!user) {
        return;
      }

      setLoadingBookings(true);
      const [{ data }, { data: profileData }] = await Promise.all([
        dataClient.from("bookings").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        dataClient.from("customer_profiles").select("*").eq("user_id", user.id).maybeSingle(),
      ]);

      if (ignore) {
        return;
      }

      const currentProfile = (profileData as CustomerProfile | null) ?? null;
      setProfile(currentProfile);
      setProfileForm((currentForm) => (editingProfile ? currentForm : createProfileForm(currentProfile, user)));

      const bookingRows = (data || []) as BookingRow[];

      if (!bookingRows.length) {
        setBookings([]);
        setLoadingBookings(false);
        return;
      }

      const modelIds = [...new Set(bookingRows.map((booking) => booking.model_id).filter(Boolean))] as string[];
      const repairCategoryIds = [...new Set(bookingRows.map((booking) => booking.repair_category_id).filter(Boolean))] as string[];
      const repairSubcategoryIds = [...new Set(bookingRows.map((booking) => booking.repair_subcategory_id).filter(Boolean))] as string[];
      const bookingIds = bookingRows.map((booking) => booking.id);

      const [{ data: models }, { data: repairCategories }, { data: repairSubcategories }, { data: billRows }] = await Promise.all([
        modelIds.length
          ? dataClient.from("models").select("id, name, series_id").in("id", modelIds)
          : Promise.resolve({ data: [] as Array<{ id: string; name: string; series_id: string }> }),
        repairCategoryIds.length
          ? dataClient.from("repair_categories").select("id, name").in("id", repairCategoryIds)
          : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
        repairSubcategoryIds.length
          ? dataClient.from("repair_subcategories").select("id, name").in("id", repairSubcategoryIds)
          : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
        bookingIds.length
          ? (dataClient as any)
              .from("service_bills")
              .select("id, booking_id, invoice_number, customer_name, customer_phone, service_type, description, amount, discount, tax, total_amount, payment_status, payment_mode, notes, warranty_duration_value, warranty_duration_unit, warranty_label, created_at")
              .in("booking_id", bookingIds)
              .order("created_at", { ascending: false })
          : Promise.resolve({ data: [] as AccountBill[] }),
      ]);

      const typedModels = (models || []) as Array<{ id: string; name: string; series_id: string }>;
      const typedRepairCategories = (repairCategories || []) as Array<{ id: string; name: string }>;
      const typedRepairSubcategories = (repairSubcategories || []) as Array<{ id: string; name: string }>;
      const modelMap = new Map<string, { id: string; name: string; series_id: string }>(typedModels.map((model) => [model.id, model]));
      const seriesIds = [...new Set(typedModels.map((model) => model.series_id).filter(Boolean))];
      const { data: seriesRows } =
        seriesIds.length ? await dataClient.from("series").select("id, brand_id").in("id", seriesIds) : { data: [] as Array<{ id: string; brand_id: string }> };
      const typedSeriesRows = (seriesRows || []) as Array<{ id: string; brand_id: string }>;
      const seriesMap = new Map<string, { id: string; brand_id: string }>(typedSeriesRows.map((series) => [series.id, series]));
      const brandIds = [...new Set(typedSeriesRows.map((series) => series.brand_id).filter(Boolean))];
      const { data: brandRows } =
        brandIds.length ? await dataClient.from("brands").select("id, name").in("id", brandIds) : { data: [] as Array<{ id: string; name: string }> };
      const typedBrandRows = (brandRows || []) as Array<{ id: string; name: string }>;
      const brandMap = new Map<string, { id: string; name: string }>(typedBrandRows.map((brand) => [brand.id, brand]));
      const repairCategoryMap = new Map<string, string>(typedRepairCategories.map((category) => [category.id, category.name]));
      const repairSubcategoryMap = new Map<string, string>(typedRepairSubcategories.map((subcategory) => [subcategory.id, subcategory.name]));
      const invoiceMap = new Map<string, AccountBill>();
      ((billRows || []) as AccountBill[]).forEach((bill) => {
        if (bill.booking_id && !invoiceMap.has(bill.booking_id)) {
          invoiceMap.set(bill.booking_id, bill);
        }
      });

      const enriched = bookingRows.map((booking) => {
        const model = booking.model_id ? modelMap.get(booking.model_id) : undefined;
        const series = model ? seriesMap.get(model.series_id) : undefined;
        const brand = series ? brandMap.get(series.brand_id) : undefined;

        return {
          ...booking,
          brand_name: brand?.name || "",
          model_name: model?.name || "",
          repair_category_name: booking.repair_category_id ? repairCategoryMap.get(booking.repair_category_id) || "" : "",
          repair_subcategory_name: booking.repair_subcategory_id ? repairSubcategoryMap.get(booking.repair_subcategory_id) || "" : "",
          invoice: invoiceMap.get(booking.id) || null,
        };
      });

      if (!ignore) {
        setBookings(enriched);
        setLoadingBookings(false);
      }
    }

    if (!user?.id) {
      return () => {
        ignore = true;
      };
    }

    loadBookings();

    const bookingsChannel = dataClient
      .channel(`account-bookings-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings", filter: `user_id=eq.${user.id}` }, loadBookings)
      .subscribe();

    const profilesChannel = dataClient
      .channel(`account-profiles-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "customer_profiles", filter: `user_id=eq.${user.id}` }, loadBookings)
      .subscribe();

    return () => {
      ignore = true;
      void bookingsChannel.unsubscribe();
      void profilesChannel.unsubscribe();
    };
  }, [editingProfile, dataClient, user]);

  const filteredBookings = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return bookings.filter((booking) => {
      const matchesStatus = activeTab === "all" || booking.status === activeTab;
      const matchesQuery =
        !normalizedQuery ||
        [
          booking.id,
          booking.brand_name,
          booking.model_name,
          booking.location,
          booking.guard_type,
          booking.cctv_service,
          booking.cctv_brand,
          booking.repair_category_name,
          booking.repair_subcategory_name,
          formatServiceType(booking.service_type),
          formatStatus(booking.status),
        ]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(normalizedQuery));

      return matchesStatus && matchesQuery;
    });
  }, [activeTab, bookings, searchQuery]);

  const dashboardStats = useMemo(
    () => [
      { label: "Total orders", value: bookings.length, hint: "All bookings synced live", icon: Package },
      {
        label: "Active orders",
        value: bookings.filter((booking) => ["pending", "confirmed", "in_progress"].includes(booking.status)).length,
        hint: "Booked, confirmed, or in service",
        icon: Clock3,
      },
      {
        label: "Upcoming visits",
        value: bookings.filter((booking) => booking.scheduled_date && !["completed", "cancelled"].includes(booking.status)).length,
        hint: "Orders with a scheduled slot",
        icon: CalendarCheck,
      },
      {
        label: "Completed",
        value: bookings.filter((booking) => booking.status === "completed").length,
        hint: "Finished orders in your history",
        icon: CheckCircle2,
      },
    ],
    [bookings],
  );

  async function handleSignOut() {
    await dataClient.auth.signOut();
    router.replace("/");
    router.refresh();
  }

  function handleProfileChange(field: keyof ProfileFormState, value: string) {
    setProfileError("");
    setProfileSuccess("");
    setProfileForm((current) => ({ ...current, [field]: value }));
  }

  function startEditingProfile() {
    setProfileError("");
    setProfileSuccess("");
    setProfileForm(createProfileForm(profile, user));
    setEditingProfile(true);
  }

  function cancelEditingProfile() {
    setProfileError("");
    setProfileSuccess("");
    setProfileForm(createProfileForm(profile, user));
    setEditingProfile(false);
  }

  async function handleSaveProfile() {
    if (!user) return;

    const trimmed = Object.fromEntries(Object.entries(profileForm).map(([key, value]) => [key, value.trim()])) as ProfileFormState;

    if (!trimmed.fullName) {
      setProfileError("Please enter your full name.");
      return;
    }
    if (trimmed.phone && !isValidPhoneNumber(trimmed.phone)) {
      setProfileError("Please enter a valid phone number.");
      return;
    }
    if (trimmed.pincode && !isValidPincode(trimmed.pincode)) {
      setProfileError("Please enter a valid 6-digit pincode.");
      return;
    }

    setSavingProfile(true);
    setProfileError("");
    setProfileSuccess("");

    const payload = buildCustomerProfileInsert({
      userId: user.id,
      fullName: trimmed.fullName,
      phone: trimmed.phone,
      address: trimmed.address,
      city: trimmed.city,
      pincode: trimmed.pincode,
    });

    const [{ error: profileSaveError }, { error: authUpdateError }] = await Promise.all([
      dataClient.from("customer_profiles").upsert(payload as any, { onConflict: "user_id" }),
      dataClient.auth.updateUser({ data: { full_name: trimmed.fullName } }),
    ]);

    if (profileSaveError || authUpdateError) {
      setProfileError(profileSaveError?.message || authUpdateError?.message || "We couldn't save your profile right now.");
      setSavingProfile(false);
      return;
    }

    const nextProfile: CustomerProfile = {
      address: trimmed.address || null,
      city: trimmed.city || null,
      created_at: profile?.created_at || new Date().toISOString(),
      full_name: trimmed.fullName,
      inspect_latitude: profile?.inspect_latitude ?? null,
      inspect_longitude: profile?.inspect_longitude ?? null,
      phone: trimmed.phone || null,
      pincode: trimmed.pincode || null,
      updated_at: new Date().toISOString(),
      user_id: user.id,
    };

    setProfile(nextProfile);
    setProfileForm(createProfileForm(nextProfile, user));
    setProfileSuccess("Profile updated successfully.");
    setSavingProfile(false);
    setEditingProfile(false);
    router.refresh();
  }

  async function handleCancelBooking(bookingId: string) {
    if (!user) {
      return;
    }

    setBookingActionError("");
    setCancelingBookingId(bookingId);

    const { error } = await dataClient
      .from("bookings")
      .update({ status: "cancelled" } as never)
      .eq("id", bookingId)
      .eq("user_id", user.id)
      .eq("status", "pending");

    if (error) {
      setBookingActionError(error.message || "We couldn't cancel this booking right now.");
      setCancelingBookingId(null);
      return;
    }

    setBookings((current) => current.map((booking) => (booking.id === bookingId ? { ...booking, status: "cancelled" } : booking)));
    setCancelingBookingId(null);
  }

  function handleDownloadInvoice(booking: AccountBooking) {
    const bill = booking.invoice;
    if (!bill) {
      setBookingActionError("Invoice is not available for this order yet.");
      return;
    }

    setBookingActionError("");
    downloadInvoicePdf({
      id: bill.id,
      invoice_number: bill.invoice_number,
      customer_name: bill.customer_name || profile?.full_name || booking.brand_name || "Customer",
      customer_phone: bill.customer_phone || profile?.phone || null,
      service_type: bill.service_type || booking.service_type,
      description: bill.description || getBookingDescriptor(booking),
      amount: Number(bill.amount || bill.total_amount || 0),
      discount: Number(bill.discount || 0),
      tax: Number(bill.tax || 0),
      total_amount: Number(bill.total_amount || bill.amount || 0),
      payment_status: bill.payment_status || "paid",
      payment_mode: bill.payment_mode || null,
      notes: bill.notes || booking.notes || null,
      warranty_duration_value: bill.warranty_duration_value ?? null,
      warranty_duration_unit: bill.warranty_duration_unit ?? null,
      warranty_label: bill.warranty_label ?? null,
      created_at: bill.created_at || booking.created_at,
    });
  }

  if (loadingUser || !user) {
    return (
      <main className="flex min-h-[60vh] flex-1 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </main>
    );
  }

  const customerName = profile?.full_name || user.user_metadata?.full_name || "My Account";
  const statusCounts = new Map(statusTabs.map((tab) => [tab.id, tab.id === "all" ? bookings.length : bookings.filter((booking) => booking.status === tab.id).length]));

  return (
    <main className="flex-1 bg-[radial-gradient(circle_at_top,_hsl(211_100%_50%_/_0.14),_transparent_30%),radial-gradient(circle_at_80%_8%,_hsl(165_100%_42%_/_0.14),_transparent_26%),linear-gradient(180deg,_rgba(255,255,255,0)_0%,_rgba(248,250,252,0.92)_100%)]">
      <div className="container max-w-6xl p-3 sm:p-6 lg:py-8">
        <section className="overflow-hidden rounded-2xl border border-primary/15 bg-card shadow-elevated-brand sm:rounded-[26px]">
          <div className="border-b border-white/15 gradient-brand px-4 py-3.5 text-white sm:px-6 sm:py-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="max-w-2xl min-w-0">
                <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/85 sm:mb-3 sm:text-[11px] sm:tracking-[0.18em]">
                  <ShieldCheck className="size-3" />
                  Orders Dashboard
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/15 shadow-sm">
                    <User className="size-4.5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl md:text-[1.65rem]">{customerName}</h1>
                    <p className="truncate text-[13px] text-white/70">{user.email}</p>
                  </div>
                </div>
                <p className="mt-2.5 max-w-lg text-[13px] leading-5 text-white/80 sm:mt-3 sm:text-sm">
                  Track bookings, update your address, and act on pending requests quickly.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="min-w-0 flex-1 rounded-xl border border-white/20 bg-white/15 px-3 py-2.5 text-sm sm:flex-none sm:min-w-[220px]">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-white/70 sm:text-[11px] sm:tracking-[0.2em]">Primary contact</div>
                  <div className="mt-1 truncate text-[13px] font-semibold text-white sm:text-sm">{profile?.phone || "Add your phone number"}</div>
                </div>
                <Button variant="secondary" size="sm" onClick={handleSignOut} className="h-10 rounded-xl border border-white/20 bg-white/15 px-3 text-white hover:bg-white/20 hover:text-white">
                  <LogOut className="size-4" />
                  Logout
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4 sm:gap-3 sm:p-6">
            {dashboardStats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-primary/10 bg-primary/[0.04] p-3 sm:p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:text-[11px] sm:tracking-[0.18em]">{stat.label}</p>
                    <p className="mt-1 text-2xl font-black tracking-tight text-foreground sm:mt-2">{stat.value}</p>
                    <p className="mt-1 hidden text-xs text-muted-foreground sm:block">{stat.hint}</p>
                  </div>
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl gradient-brand text-primary-foreground sm:size-10">
                    <stat.icon className="size-4 sm:size-5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-4 grid gap-4 xl:grid-cols-[1.4fr_0.95fr]">
          <div className="order-1 space-y-4">
            <div className="rounded-2xl border border-border/70 bg-card p-3 shadow-sm sm:rounded-[24px] sm:p-4">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3">
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight text-foreground">Your bookings</h2>
                    <p className="text-sm text-muted-foreground">Search orders, filter status, and manage bookings from your phone.</p>
                  </div>
                </div>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search orders" className="h-11 rounded-xl border-border/70 bg-background pl-9" />
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                  {statusTabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex min-h-11 items-center justify-center gap-1.5 rounded-xl border p-2 text-center text-[11px] font-bold transition-all sm:gap-2 sm:px-3 sm:text-xs ${
                          isActive ? "border-transparent gradient-brand text-primary-foreground shadow-md" : "border-border/70 bg-background text-muted-foreground"
                        }`}
                      >
                        <tab.icon className="size-3.5 shrink-0" />
                        <span className="min-w-0 truncate">{tab.label}</span>
                        <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] ${isActive ? "bg-white/20" : "bg-secondary text-foreground"}`}>{statusCounts.get(tab.id) || 0}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {bookingActionError ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{bookingActionError}</p> : null}

            {loadingBookings ? (
              <div className="flex justify-center rounded-[24px] border border-border/70 bg-card py-20 shadow-sm">
                <Loader2 className="size-6 animate-spin text-primary" />
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-border bg-card px-6 py-16 text-center shadow-sm">
                <CalendarCheck className="mx-auto mb-4 size-11 text-muted-foreground/35" />
                <p className="text-base font-semibold text-foreground">{activeTab === "all" && !searchQuery ? "No bookings yet" : "No orders match this view"}</p>
                <p className="mt-2 text-sm text-muted-foreground">Try another filter or book a new service to see it appear here.</p>
                <Link href="/" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  Browse services
                  <ChevronRight className="size-4" />
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBookings.map((booking) => (
                  <article key={booking.id} className="rounded-2xl border border-border/70 bg-card p-3 shadow-sm sm:rounded-[24px] sm:p-4">
                    <div className="space-y-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">{booking.booking_code || `#${booking.id.slice(0, 8).toUpperCase()}`}</span>
                            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusColors[booking.status] || "border-border bg-secondary text-foreground"}`}>
                              {formatStatus(booking.status)}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-base font-semibold tracking-tight text-foreground">{getBookingTitle(booking)}</h3>
                            <p className="mt-1 text-sm text-muted-foreground">{getBookingDescriptor(booking)}</p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          {canDownloadInvoice(booking) ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadInvoice(booking)}
                              className="h-11 w-full rounded-xl border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 sm:w-auto"
                              aria-label={`Download invoice for ${booking.booking_code || booking.id}`}
                            >
                              <Download className="size-4" />
                              Invoice
                            </Button>
                          ) : null}
                          {canCancelBooking(booking) ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelBooking(booking.id)}
                              disabled={cancelingBookingId === booking.id}
                              className="h-11 w-full rounded-xl border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-700 sm:w-auto"
                            >
                              {cancelingBookingId === booking.id ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />}
                              Cancel order
                            </Button>
                          ) : null}
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-border/70 bg-background p-3">
                          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"><CalendarCheck className="size-3.5" />Schedule</div>
                          <div className="mt-2 text-sm font-semibold text-foreground">{booking.scheduled_date ? formatDate(booking.scheduled_date) : "Scheduling pending"}</div>
                          <div className="mt-1 text-sm text-muted-foreground">{booking.time_slot || "Time slot to be assigned"}</div>
                        </div>
                        <div className="rounded-2xl border border-border/70 bg-background p-3">
                          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"><MapPin className="size-3.5" />Address</div>
                          <div className="mt-2 text-sm font-semibold text-foreground">{booking.location || "Address not saved yet"}</div>
                          <div className="mt-1 text-sm text-muted-foreground">{booking.pincode ? `Pincode ${booking.pincode}` : "Add pincode in your profile"}</div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border/70 bg-background p-3">
                        <div className="flex items-start gap-3">
                          <div>
                            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Timeline</div>
                            <div className="mt-2 text-sm font-semibold text-foreground">Booked on {formatDate(booking.created_at)}</div>
                            <div className="mt-1 text-sm text-muted-foreground">{booking.notes || "No additional notes were added to this order."}</div>
                          </div>
                        </div>
                        {canCancelBooking(booking) ? <p className="mt-3 text-xs text-muted-foreground">You can cancel this booking until it is confirmed by the team.</p> : null}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {buybackOrders}
          </div>

          <aside className="order-2 space-y-4">
            <section className="rounded-[24px] border border-border/70 bg-card p-4 shadow-sm sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-foreground">Profile details</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Keep your contact info ready for faster confirmations.</p>
                </div>
                {!editingProfile ? (
                  <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={startEditingProfile}>
                    <PencilLine className="size-4" />
                    Edit
                  </Button>
                ) : null}
              </div>

              <div className="mt-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="field-accountpageclient-665" className="mb-2 block text-sm font-semibold text-foreground">Full name</label>
                    <Input id="field-accountpageclient-665" value={profileForm.fullName} onChange={(event) => handleProfileChange("fullName", event.target.value)} disabled={!editingProfile} className="rounded-xl" placeholder="Your full name" />
                  </div>
                  <div>
                    <label htmlFor="field-accountpageclient-669" className="mb-2 block text-sm font-semibold text-foreground">Phone number</label>
                    <Input id="field-accountpageclient-669" value={profileForm.phone} onChange={(event) => handleProfileChange("phone", event.target.value)} disabled={!editingProfile} className="rounded-xl" placeholder="10-digit phone number" />
                  </div>
                </div>
                <div>
                  <label htmlFor="field-accountpageclient-674" className="mb-2 block text-sm font-semibold text-foreground">Address</label>
                  <Textarea value={profileForm.address} onChange={(event) => handleProfileChange("address", event.target.value)} disabled={!editingProfile} className="min-h-[96px] rounded-xl" placeholder="House, street, or landmark" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="field-accountpageclient-679" className="mb-2 block text-sm font-semibold text-foreground">City</label>
                    <Input id="field-accountpageclient-679" value={profileForm.city} onChange={(event) => handleProfileChange("city", event.target.value)} disabled={!editingProfile} className="rounded-xl" placeholder="City" />
                  </div>
                  <div>
                    <label htmlFor="field-accountpageclient-683" className="mb-2 block text-sm font-semibold text-foreground">Pincode</label>
                    <Input id="field-accountpageclient-683" value={profileForm.pincode} onChange={(event) => handleProfileChange("pincode", event.target.value)} disabled={!editingProfile} className="rounded-xl" placeholder="6-digit pincode" />
                  </div>
                </div>
                {profileError ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{profileError}</p> : null}
                {profileSuccess ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{profileSuccess}</p> : null}

                {editingProfile ? (
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button type="button" onClick={handleSaveProfile} disabled={savingProfile} className="rounded-xl sm:flex-1">
                      {savingProfile ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                      Save profile
                    </Button>
                    <Button type="button" variant="outline" onClick={cancelEditingProfile} disabled={savingProfile} className="rounded-xl sm:flex-1">
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-3 rounded-2xl border border-border/70 bg-background p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="size-4" />{profile?.phone || "No phone number saved yet"}</div>
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="mt-0.5 size-4" />
                      <span>{profile?.address ? [profile.address, profile.city, profile.pincode].filter(Boolean).join(", ") : "No service address saved yet"}</span>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[24px] border border-border/70 bg-card p-4 shadow-sm sm:p-5">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">Quick snapshot</h2>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-border/70 bg-background p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Latest booking</div>
                  <div className="mt-2 text-sm font-semibold text-foreground">{bookings[0] ? `${bookings[0].booking_code || getBookingTitle(bookings[0])} • ${formatStatus(bookings[0].status)}` : "No bookings yet"}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{bookings[0]?.scheduled_date ? formatDate(bookings[0].scheduled_date) : "Create a booking to get started"}</div>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Recommended next step</div>
                  <div className="mt-2 text-sm text-foreground">
                    {profile?.address && profile?.phone ? "Your account is ready for faster checkout on the next booking." : "Complete your profile details so future bookings need less manual input."}
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
