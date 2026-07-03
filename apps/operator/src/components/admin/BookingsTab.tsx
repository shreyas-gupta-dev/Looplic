import { useEffect, useMemo, useState } from "react";
import { Bike, CalendarDays, ClipboardPlus, Eye, IndianRupee, Loader2, MapPin, Phone, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/src/components/ui/input";
import { formatBookingServiceType, formatBookingStatus, formatCctvBookingSelection, type BookingRow } from "@/src/lib/bookings";
import { notifyLeadSubmission } from "@/src/lib/leads/client";
import { getServiceTypeLabels, orderServiceTypes, technicianSupportsService } from "@/src/lib/service-types";
import { createClient } from "@/src/lib/data-client/client";
import { buildWarrantyFields, formatWarrantyLabel, WARRANTY_PRESETS, WARRANTY_UNITS } from "@/src/lib/warranty";

type BookingView = BookingRow & {
  brand_name: string;
  model_name: string;
  repair_category_name: string;
  repair_subcategory_name: string;
  assigned_rider?: string | null;
  assignment_notes?: string | null;
  assigned_at?: string | null;
  warranty_duration_value?: number | null;
  warranty_duration_unit?: string | null;
  warranty_label?: string | null;
};

type BillSummary = {
  booking_id: string | null;
  total_amount: number;
  payment_status: string;
  created_at: string;
};

type InspectionSummary = {
  booking_id: string;
  status: string;
  reported_issue: string | null;
  device_condition: string | null;
  accessories_received: string | null;
  customer_approval: string | null;
  pickup_required: boolean | null;
  pickup_notes: string | null;
  quote_amount: number | null;
  quote_notes: string | null;
  warranty_label?: string | null;
};

type ModelLookup = { id: string; name: string; series_id: string };
type SeriesLookup = { id: string; name?: string; brand_id: string };
type BrandLookup = { id: string; name: string; service_type: string };
type RepairCategoryLookup = { id: string; name: string; service_type: string };
type RepairSubcategoryLookup = { id: string; name: string; category_id: string; price?: number | null };
type TechnicianOption = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  city: string | null;
  service_types?: string[] | null;
};

type CreateOrderForm = {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  serviceType: string;
  brandId: string;
  seriesId: string;
  modelId: string;
  repairCategoryId: string;
  repairSubcategoryId: string;
  address: string;
  city: string;
  pincode: string;
  scheduledDate: string;
  timeSlot: string;
  status: string;
  assignedRider: string;
  assignmentNotes: string;
  notes: string;
  warrantyPreset: string;
  warrantyValue: string;
  warrantyUnit: string;
};

const statusColors: Record<string, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  confirmed: "border-sky-200 bg-sky-50 text-sky-800",
  in_progress: "border-violet-200 bg-violet-50 text-violet-800",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  cancelled: "border-rose-200 bg-rose-50 text-rose-800",
};

const timeSlots = ["8 AM - 11 AM", "11 AM - 2 PM", "2 PM - 5 PM", "5 PM - 8 PM"] as const;

function getInitialCreateOrderForm(): CreateOrderForm {
  return {
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    serviceType: "mobile_repair",
    brandId: "",
    seriesId: "",
    modelId: "",
    repairCategoryId: "",
    repairSubcategoryId: "",
    address: "",
    city: "Bangalore",
    pincode: "",
    scheduledDate: "",
    timeSlot: "",
    status: "confirmed",
    assignedRider: "",
    assignmentNotes: "",
    notes: "",
    warrantyPreset: "none",
    warrantyValue: "",
    warrantyUnit: "months",
  };
}

type BookingsTabProps = {
  role?: "admin" | "operation";
  // Explicit override for the delete control. When omitted, deletes follow the
  // role (admin only). The operator console passes role="admin" for full
  // feature access but canDelete={false} so operators can do everything except
  // delete orders.
  canDelete?: boolean;
};

const BookingsTab = ({ role = "operation", canDelete }: BookingsTabProps) => {
  const dataClient = createClient();
  const canDeleteOrders = canDelete ?? role === "admin";
  const [bookings, setBookings] = useState<BookingView[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [detail, setDetail] = useState<BookingView | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [riderFilter, setRiderFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [bills, setBills] = useState<BillSummary[]>([]);
  const [inspections, setInspections] = useState<InspectionSummary[]>([]);
  const [assignTarget, setAssignTarget] = useState<BookingView | null>(null);
  const [assignedRider, setAssignedRider] = useState("");
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [technicians, setTechnicians] = useState<TechnicianOption[]>([]);
  const [technicianSearch, setTechnicianSearch] = useState("");
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [createOrder, setCreateOrder] = useState<CreateOrderForm>(() => getInitialCreateOrderForm());
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [catalogBrands, setCatalogBrands] = useState<BrandLookup[]>([]);
  const [catalogSeries, setCatalogSeries] = useState<SeriesLookup[]>([]);
  const [catalogModels, setCatalogModels] = useState<ModelLookup[]>([]);
  const [catalogCategories, setCatalogCategories] = useState<RepairCategoryLookup[]>([]);
  const [catalogSubcategories, setCatalogSubcategories] = useState<RepairSubcategoryLookup[]>([]);

  async function fetchApprovedTechnicians() {
    const withServices = await (dataClient as any)
      .from("technician_applications")
      .select("id, full_name, email, phone, city, service_types")
      .eq("status", "approved")
      .order("full_name");

    if (!withServices.error) {
      return withServices.data || [];
    }

    if (!String(withServices.error.message || "").includes("service_types")) {
      return [];
    }

    const fallback = await (dataClient as any)
      .from("technician_applications")
      .select("id, full_name, email, phone, city")
      .eq("status", "approved")
      .order("full_name");

    return fallback.data || [];
  }

  async function fetchBookings() {
    setErrorMessage("");

    // Single round-trip: the catalog lists (all brands/series/models + repair
    // options) are fetched alongside the bookings, then reused below to resolve
    // booking names locally — no follow-up per-id lookups needed.
    const [{ data, error }, { data: billRows }, { data: inspectionRows }, technicianRows, { data: brandRowsForCreate }, { data: seriesRowsForCreate }, { data: modelRowsForCreate }, catalogResult] = await Promise.all([
      dataClient.from("bookings").select("*").order("created_at", { ascending: false }),
      (dataClient as any).from("service_bills").select("booking_id, total_amount, payment_status, created_at"),
      (dataClient as any).from("booking_inspections").select("booking_id, status, reported_issue, device_condition, accessories_received, customer_approval, pickup_required, pickup_notes, quote_amount, quote_notes, warranty_label").order("created_at", { ascending: false }),
      fetchApprovedTechnicians(),
      dataClient.from("brands").select("id, name, service_type").order("name"),
      dataClient.from("series").select("id, name, brand_id").order("name"),
      dataClient.from("models").select("id, name, series_id").order("name"),
      fetch("/api/catalog/repair-options").then((response) => response.ok ? response.json() : { categories: [], subcategories: [] }).catch(() => ({ categories: [], subcategories: [] })),
    ]);
    const brandList = (brandRowsForCreate || []) as BrandLookup[];
    const seriesList = (seriesRowsForCreate || []) as SeriesLookup[];
    const modelList = (modelRowsForCreate || []) as ModelLookup[];
    const categoryList = (catalogResult.categories || []) as RepairCategoryLookup[];
    const subcategoryList = (catalogResult.subcategories || []) as RepairSubcategoryLookup[];
    setBills((billRows || []) as BillSummary[]);
    setInspections((inspectionRows || []) as InspectionSummary[]);
    setTechnicians((technicianRows || []) as TechnicianOption[]);
    setCatalogBrands(brandList);
    setCatalogSeries(seriesList);
    setCatalogModels(modelList);
    setCatalogCategories(categoryList);
    setCatalogSubcategories(subcategoryList);
    if (error) {
      setBookings([]);
      setErrorMessage(error.message || "Failed to load bookings.");
      return;
    }

    const rows = (data || []) as BookingRow[];
    if (!rows.length) {
      setBookings([]);
      return;
    }

    const modelMap = new Map<string, ModelLookup>(modelList.map((model) => [model.id, model]));
    const seriesMap = new Map<string, SeriesLookup>(seriesList.map((series) => [series.id, series]));
    const brandMap = new Map<string, string>(brandList.map((brand) => [brand.id, brand.name]));
    const repairCategoryMap = new Map<string, string>(categoryList.map((category) => [category.id, category.name]));
    const repairSubcategoryMap = new Map<string, string>(subcategoryList.map((subcategory) => [subcategory.id, subcategory.name]));

    setBookings(
      rows.map((booking) => {
        const model = booking.model_id ? modelMap.get(booking.model_id) : undefined;
        const series = model ? seriesMap.get(model.series_id) : undefined;
        return {
          ...booking,
          brand_name: series ? brandMap.get(series.brand_id) || "" : "",
          model_name: model?.name || "",
          repair_category_name: booking.repair_category_id ? repairCategoryMap.get(booking.repair_category_id) || "" : "",
          repair_subcategory_name: booking.repair_subcategory_id ? repairSubcategoryMap.get(booking.repair_subcategory_id) || "" : "",
        };
      }),
    );
  }

  useEffect(() => {
    fetchBookings();
    const channel = dataClient
      .channel("admin-bookings")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, fetchBookings)
      .subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, []);

  const filteredBookings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const today = new Date().toISOString().slice(0, 10);
    return bookings.filter((booking) => {
      const bill = bills.find((item) => item.booking_id === booking.id);
      const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
      const matchesService = serviceFilter === "all" || booking.service_type === serviceFilter;
      const matchesPayment = paymentFilter === "all" || (paymentFilter === "no_bill" ? !bill : bill?.payment_status === paymentFilter);
      const bookingDate = booking.scheduled_date || booking.created_at;
      const matchesDate =
        dateFilter === "all" ||
        (dateFilter === "today" && bookingDate?.slice(0, 10) === today) ||
        (dateFilter === "unscheduled" && !booking.scheduled_date);
      const matchesRider = riderFilter === "all" || (riderFilter === "unassigned" ? !booking.assigned_rider : booking.assigned_rider === riderFilter);
      const matchesSearch =
        !query ||
        [booking.booking_code, booking.customer_name, booking.customer_phone, booking.brand_name, booking.model_name, booking.location, booking.guard_type, booking.cctv_service, booking.cctv_brand, booking.assigned_rider]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(query));
      return matchesStatus && matchesService && matchesPayment && matchesDate && matchesRider && matchesSearch;
    });
  }, [bills, bookings, dateFilter, paymentFilter, riderFilter, searchQuery, serviceFilter, statusFilter]);

  async function updateStatus(id: string, status: string) {
    setBookings((current) => current.map((booking) => (booking.id === id ? { ...booking, status } : booking)));
    setDetail((current) => (current && current.id === id ? { ...current, status } : current));
    const { error } = await dataClient.from("bookings").update({ status } as never).eq("id", id);
    if (error) {
      toast.error(error.message || "Failed to update booking status.");
      fetchBookings();
      return;
    }
    toast.success("Booking status updated.");
  }

  async function deleteBooking(id: string) {
    const previousBookings = bookings;
    const previousDetail = detail;
    setBookings((current) => current.filter((booking) => booking.id !== id));
    setDetail((current) => (current?.id === id ? null : current));
    const { error } = await dataClient.from("bookings").delete().eq("id", id);
    if (error) {
      toast.error(error.message || "Failed to delete booking.");
      setBookings(previousBookings);
      setDetail(previousDetail);
      return;
    }
    toast.success("Booking deleted.");
  }

  function openAssignment(booking: BookingView) {
    if (booking.status === "completed") {
      toast.error("Completed orders are locked and cannot be reassigned.");
      return;
    }
    setAssignTarget(booking);
    setAssignedRider(booking.assigned_rider || "");
    setAssignmentNotes(booking.assignment_notes || "");
    setTechnicianSearch("");
  }

  async function saveAssignment() {
    if (!assignTarget) {
      return;
    }
    if (assignTarget.status === "completed") {
      toast.error("Completed orders are locked and cannot be reassigned.");
      setAssignTarget(null);
      return;
    }

    setAssigning(true);
    const selectedTechnician = technicians.find((technician) => technician.email === assignedRider);
    if (selectedTechnician && !technicianSupportsService(selectedTechnician.service_types, assignTarget.service_type)) {
      setAssigning(false);
      toast.error(`${selectedTechnician.full_name || selectedTechnician.email} does not support ${formatBookingServiceType(assignTarget.service_type)}.`);
      return;
    }
    const updates = {
      assigned_rider: selectedTechnician?.email || assignedRider.trim() || null,
      assignment_notes: assignmentNotes.trim() || null,
      assigned_at: new Date().toISOString(),
    };
    setBookings((current) => current.map((booking) => (booking.id === assignTarget.id ? { ...booking, ...updates } : booking)));
    setDetail((current) => (current?.id === assignTarget.id ? { ...current, ...updates } : current));
    const { error } = await (dataClient as any).from("bookings").update(updates).eq("id", assignTarget.id);
    setAssigning(false);

    if (error) {
      toast.error(error.message || "Failed to save assignment.");
      fetchBookings();
      return;
    }

    toast.success("Assignment updated.");
    setAssignTarget(null);
  }

  function patchCreateOrder(updates: Partial<CreateOrderForm>) {
    setCreateOrder((current) => ({ ...current, ...updates }));
  }

  function resetCreateOrder() {
    setCreateOrder(getInitialCreateOrderForm());
  }

  function getCreateOrderCatalogType(serviceType = createOrder.serviceType) {
    return orderServiceTypes.find((service) => service.value === serviceType)?.catalogType || "";
  }

  function handleCreateServiceChange(serviceType: string) {
    patchCreateOrder({
      serviceType,
      brandId: "",
      seriesId: "",
      modelId: "",
      repairCategoryId: "",
      repairSubcategoryId: "",
      assignedRider: "",
    });
  }

  function handleCreateSubcategoryChange(subcategoryId: string) {
    const subcategory = catalogSubcategories.find((item) => item.id === subcategoryId);
    patchCreateOrder({
      repairSubcategoryId: subcategoryId,
      notes: subcategory?.name && !createOrder.notes ? subcategory.name : createOrder.notes,
    });
  }

  function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  async function submitCreateOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const catalogType = getCreateOrderCatalogType();
    if (!createOrder.customerName.trim() || !createOrder.customerPhone.trim()) {
      toast.error("Add customer name and phone number.");
      return;
    }
    if (catalogType && !createOrder.modelId) {
      toast.error("Select brand, series, and model for this order.");
      return;
    }
    if (createOrder.customerEmail.trim() && !isValidEmail(createOrder.customerEmail)) {
      toast.error("Enter a valid customer email address.");
      return;
    }

    setCreatingOrder(true);
    const { data: userData } = await dataClient.auth.getUser();
    const selectedTechnician = technicians.find((technician) => technician.email === createOrder.assignedRider);
    if (selectedTechnician && !technicianSupportsService(selectedTechnician.service_types, createOrder.serviceType)) {
      setCreatingOrder(false);
      toast.error(`${selectedTechnician.full_name || selectedTechnician.email} does not support ${formatBookingServiceType(createOrder.serviceType)}.`);
      return;
    }
    const location = [createOrder.address.trim(), createOrder.city.trim()].filter(Boolean).join(", ");
    const warrantyFields = buildWarrantyFields({ preset: createOrder.warrantyPreset, value: createOrder.warrantyValue, unit: createOrder.warrantyUnit });
    const payload = {
      customer_name: createOrder.customerName.trim(),
      customer_phone: createOrder.customerPhone.trim(),
      service_type: createOrder.serviceType,
      model_id: createOrder.modelId || null,
      repair_category_id: createOrder.repairCategoryId || null,
      repair_subcategory_id: createOrder.repairSubcategoryId || null,
      location: location || null,
      pincode: createOrder.pincode.trim() || null,
      scheduled_date: createOrder.scheduledDate || null,
      time_slot: createOrder.timeSlot || null,
      status: createOrder.status,
      assigned_rider: selectedTechnician?.email || createOrder.assignedRider.trim() || null,
      assignment_notes: createOrder.assignmentNotes.trim() || null,
      assigned_at: createOrder.assignedRider ? new Date().toISOString() : null,
      notes: createOrder.notes.trim() || null,
      ...warrantyFields,
      manual_order: true,
      order_source: role,
      created_by: userData?.user?.id || null,
    };

    const insertResult = await (dataClient as any).from("bookings").insert(payload).select("id, booking_code").single();
    const bookingCode = insertResult.data?.booking_code || "";

    if (insertResult.error && String(insertResult.error.message || "").includes("booking_code")) {
      const fallbackResult = await (dataClient as any).from("bookings").insert(payload).select("id").single();
      if (fallbackResult.error) {
        setCreatingOrder(false);
        toast.error(fallbackResult.error.message || "Unable to create order.");
        return;
      }
    } else if (insertResult.error) {
      setCreatingOrder(false);
      toast.error(insertResult.error.message || "Unable to create order.");
      return;
    }

    const selectedBrand = catalogBrands.find((brand) => brand.id === createOrder.brandId);
    const selectedSeries = catalogSeries.find((series) => series.id === createOrder.seriesId);
    const selectedModel = catalogModels.find((model) => model.id === createOrder.modelId);
    const selectedSubcategory = catalogSubcategories.find((subcategory) => subcategory.id === createOrder.repairSubcategoryId);
    const serviceLabel = selectedSubcategory?.name || formatBookingServiceType(createOrder.serviceType);
    const emailSent = createOrder.customerEmail.trim()
      ? await notifyLeadSubmission({
          source: "booking",
          title: "New manual Looplic order",
          customer: {
            name: createOrder.customerName,
            phone: createOrder.customerPhone,
            email: createOrder.customerEmail,
          },
          service: {
            type: createOrder.serviceType,
            label: serviceLabel,
            price: selectedSubcategory?.price,
          },
          device: {
            brand: selectedBrand?.name,
            series: selectedSeries?.name,
            model: selectedModel?.name,
          },
          schedule: {
            date: createOrder.scheduledDate,
            timeSlot: createOrder.timeSlot,
          },
          bookingCode,
          address: createOrder.address,
          city: createOrder.city,
          pincode: createOrder.pincode,
          notes: createOrder.notes,
          metadata: {
            flow: "AdminManualCreateOrder",
            role,
            status: createOrder.status,
            assignedTechnician: selectedTechnician?.email || createOrder.assignedRider || "",
            assignmentNotes: createOrder.assignmentNotes,
          },
        })
      : false;

    setCreatingOrder(false);

    if (createOrder.customerEmail.trim()) {
      toast.success(emailSent ? "Order created and customer email sent." : "Order created, but customer email was not sent.");
    } else {
      toast.success("Order created.");
    }
    setShowCreateOrder(false);
    resetCreateOrder();
    fetchBookings();
  }

  const uniqueRiders = Array.from(new Set(bookings.map((booking) => booking.assigned_rider).filter(Boolean))) as string[];
  const technicianLabelByEmail = new Map(technicians.map((technician) => [technician.email, technician.full_name || technician.email]));
  const billByBooking = new Map(bills.map((bill) => [bill.booking_id, bill]));
  const inspectionByBooking = useMemo(() => {
    const map = new Map<string, InspectionSummary>();
    inspections.forEach((inspection) => {
      if (!map.has(inspection.booking_id)) {
        map.set(inspection.booking_id, inspection);
      }
    });
    return map;
  }, [inspections]);
  const createCatalogType = getCreateOrderCatalogType();
  const createBrandOptions = createCatalogType ? catalogBrands.filter((brand) => brand.service_type === createCatalogType) : [];
  const createSeriesOptions = catalogSeries.filter((series) => series.brand_id === createOrder.brandId);
  const createModelOptions = catalogModels.filter((model) => model.series_id === createOrder.seriesId);
  const createCategoryOptions = createCatalogType ? catalogCategories.filter((category) => category.service_type === createCatalogType) : [];
  const createSubcategoryOptions = catalogSubcategories.filter((subcategory) => subcategory.category_id === createOrder.repairCategoryId);
  function getEligibleTechnicians(serviceType: string) {
    return technicians.filter((technician) => technicianSupportsService(technician.service_types, serviceType));
  }

  const createEligibleTechnicians = getEligibleTechnicians(createOrder.serviceType);
  const assignEligibleTechnicians = assignTarget ? getEligibleTechnicians(assignTarget.service_type) : technicians;
  const filteredTechnicians = assignEligibleTechnicians.filter((technician) => {
    const query = technicianSearch.trim().toLowerCase();
    if (!query) return true;
    return [technician.full_name, technician.email, technician.phone, technician.city, ...getServiceTypeLabels(technician.service_types)].filter(Boolean).some((value) => String(value).toLowerCase().includes(query));
  });

  function renderInspectionText(value: string | null | undefined) {
    if (!value) return <div className="text-muted-foreground">Not added yet</div>;

    return (
      <div className="space-y-1.5">
        {value.split("\n").filter(Boolean).map((line, index) => {
          const [label, ...rest] = line.split(":");
          const body = rest.join(":").trim();

          return body ? (
            <div key={`${line}-${index}`} className="grid gap-1 rounded-lg bg-secondary/60 px-2.5 py-2 sm:grid-cols-[130px_1fr]">
              <span className="text-[11px] font-black uppercase tracking-[0.08em] text-muted-foreground">{label}</span>
              <span className="font-semibold text-foreground">{body}</span>
            </div>
          ) : (
            <div key={`${line}-${index}`} className="pt-1 text-xs font-black uppercase tracking-[0.12em] text-primary">{line}</div>
          );
        })}
      </div>
    );
  }
  const today = new Date().toISOString().slice(0, 10);
  const todayBookings = bookings.filter((booking) => (booking.scheduled_date || booking.created_at)?.slice(0, 10) === today);
  const paidToday = bills
    .filter((bill) => bill.payment_status === "paid" && bill.created_at?.slice(0, 10) === today)
    .reduce((sum, bill) => sum + Number(bill.total_amount || 0), 0);
  const pendingAssignment = bookings.filter((booking) => !booking.assigned_rider).length;

  const stats = [
    { label: "Total orders", value: bookings.length, icon: CalendarDays },
    { label: "Today's orders", value: todayBookings.length, icon: CalendarDays },
    { label: "Today's earning", value: `₹${paidToday.toLocaleString("en-IN")}`, icon: IndianRupee },
    { label: "Needs technician", value: pendingAssignment, icon: Bike },
  ];
  const detailInspection = detail ? inspectionByBooking.get(detail.id) : null;

  return (
    <>
      <div className="mt-4 space-y-4">
        <div className="rounded-2xl border border-border/70 bg-card p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">Order management</h2>
              <p className="text-xs text-muted-foreground">Create orders manually, assign technicians, and track customer service work.</p>
            </div>
            <button type="button" onClick={() => setShowCreateOrder(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground">
              <ClipboardPlus className="size-4" />
              Create Order
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{stat.label}</div>
                  <Icon className="size-4 text-primary" />
                </div>
                <div className="mt-2 text-2xl font-black text-foreground">{stat.value}</div>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-4">
          <div className="grid gap-3 lg:grid-cols-[1.4fr_repeat(5,1fr)]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search by order code, customer, phone, device, or address" className="pl-9" />
            </div>
            <select value={serviceFilter} onChange={(event) => setServiceFilter(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground">
              <option value="all">All services</option>
              <option value="screen_guard">Device Service</option>
              <option value="mobile_repair">Mobile Repair</option>
              <option value="laptop_repair">Laptop Repair</option>
              <option value="desktop_assembly">Desktop Assembly</option>
              <option value="cctv">CCTV Installation</option>
              <option value="it_support">IT Support</option>
              <option value="managed_it_services">Managed IT Services</option>
            </select>
            <select value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground">
              <option value="all">All dates</option>
              <option value="today">Today</option>
              <option value="unscheduled">Unscheduled</option>
            </select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground">
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select value={riderFilter} onChange={(event) => setRiderFilter(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground">
              <option value="all">All technicians</option>
              <option value="unassigned">Technician unassigned</option>
              {uniqueRiders.map((rider) => <option key={rider} value={rider}>{rider}</option>)}
            </select>
            <select value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground">
              <option value="all">All payments</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partial</option>
              <option value="no_bill">No bill</option>
            </select>
          </div>
        </div>

        {errorMessage ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-5 text-sm text-rose-700">{errorMessage}</div> : null}
        {!errorMessage && filteredBookings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center text-muted-foreground">
            <p className="text-sm font-semibold text-foreground">{bookings.length === 0 ? "No bookings yet" : "No bookings match these filters"}</p>
            <p className="mt-1 text-xs">New customer orders will appear here automatically.</p>
          </div>
        ) : null}

        {!errorMessage && filteredBookings.length > 0 ? (
          <div className="space-y-3">
            {filteredBookings.map((booking) => {
              const bill = billByBooking.get(booking.id);
              const isClosed = booking.status === "completed";
              return (
              <div key={booking.id} className={`rounded-2xl border p-4 transition-colors ${isClosed ? "border-border/60 bg-muted/50 opacity-70 grayscale" : "border-border/70 bg-card"}`}>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">{booking.booking_code || "Pending code"}</span>
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusColors[booking.status] || "border-border bg-secondary text-foreground"}`}>{formatBookingStatus(booking.status)}</span>
                      {bill ? <span className="rounded-full border border-border bg-secondary px-2.5 py-1 text-[11px] font-bold text-foreground">{bill.payment_status}</span> : null}
                    </div>
                    <div className="text-base font-black text-foreground">{booking.customer_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatBookingServiceType(booking.service_type)} • {booking.service_type === "cctv" ? formatCctvBookingSelection(booking.cctv_service, booking.cctv_brand) || "CCTV details pending" : [booking.brand_name, booking.model_name].filter(Boolean).join(" ") || "Device pending"}
                    </div>
                    {booking.warranty_label || formatWarrantyLabel(booking.warranty_duration_value, booking.warranty_duration_unit) ? (
                      <div className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700">{booking.warranty_label || formatWarrantyLabel(booking.warranty_duration_value, booking.warranty_duration_unit)}</div>
                    ) : null}
                    <div className="text-xs text-muted-foreground">{booking.scheduled_date ? `${new Date(booking.scheduled_date).toLocaleDateString("en-IN")} • ${booking.time_slot || "No slot"}` : new Date(booking.created_at).toLocaleString("en-IN")}</div>
                    <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-muted-foreground">
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1"><Bike className="size-3" />{booking.assigned_rider ? technicianLabelByEmail.get(booking.assigned_rider) || booking.assigned_rider : "Technician unassigned"}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {role === "admin" ? (
                      <select value={booking.status} onChange={(event) => updateStatus(booking.id, event.target.value)} disabled={isClosed} className="h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground disabled:opacity-60">
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    ) : null}
                    <button type="button" onClick={() => openAssignment(booking)} disabled={isClosed} title={isClosed ? "Completed orders are locked" : "Assign technician"} className="rounded-lg border border-border px-3 py-2 text-xs font-bold text-foreground transition-colors hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50">
                      {isClosed ? "Locked" : "Assign"}
                    </button>
                    <button type="button" onClick={() => setDetail(booking)} className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:text-primary">
                      <Eye className="size-4" />
                    </button>
                    {canDeleteOrders ? (
                      <button type="button" onClick={() => deleteBooking(booking.id)} className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:text-destructive" title="Delete order">
                        <Trash2 className="size-4" />
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        ) : null}
      </div>

      {detail ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" onClick={() => setDetail(null)}>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative max-h-[85vh] w-full overflow-y-auto rounded-t-3xl border border-border bg-card shadow-xl sm:max-w-xl sm:rounded-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card p-4">
              <div>
                <div className="text-sm font-black text-foreground">{detail.booking_code || detail.id}</div>
                <div className="text-xs text-muted-foreground">{formatBookingServiceType(detail.service_type)}</div>
              </div>
              <button type="button" onClick={() => setDetail(null)} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"><X className="size-4" /></button>
            </div>
            <div className="space-y-4 p-4">
              <div className="rounded-2xl bg-secondary/50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-lg font-black text-foreground">{detail.customer_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {detail.service_type === "cctv" ? formatCctvBookingSelection(detail.cctv_service, detail.cctv_brand) || "CCTV details pending" : [detail.brand_name, detail.model_name].filter(Boolean).join(" ") || "Device pending"}
                    </div>
                  </div>
                  <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusColors[detail.status] || "border-border bg-secondary text-foreground"}`}>{formatBookingStatus(detail.status)}</span>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/70 p-4 text-sm"><div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Phone</div><a href={`tel:${detail.customer_phone}`} className="mt-2 inline-flex items-center gap-2 font-semibold text-primary"><Phone className="size-4" />{detail.customer_phone}</a></div>
                <div className="rounded-2xl border border-border/70 p-4 text-sm"><div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Schedule</div><div className="mt-2 font-semibold text-foreground">{detail.scheduled_date ? `${new Date(detail.scheduled_date).toLocaleDateString("en-IN")} • ${detail.time_slot || "No slot"}` : "Not scheduled yet"}</div></div>
              </div>
              <div className="rounded-2xl border border-border/70 p-4 text-sm">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Inspect Location</div>
                <div className="mt-2 flex items-start gap-2 text-foreground"><MapPin className="mt-0.5 size-4 text-muted-foreground" /><span>{detail.location || "No address saved"}</span></div>
                <div className="mt-2 text-muted-foreground">{detail.pincode ? `Pincode ${detail.pincode}` : ""}</div>
                {detail.inspect_latitude && detail.inspect_longitude ? <div className="mt-2 text-xs font-bold text-foreground">Lat {Number(detail.inspect_latitude).toFixed(6)} - Lng {Number(detail.inspect_longitude).toFixed(6)}</div> : null}
              </div>
              <div className="rounded-2xl border border-border/70 p-4 text-sm">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Service details</div>
                <div className="mt-2 text-foreground">{detail.service_type === "cctv" ? formatCctvBookingSelection(detail.cctv_service, detail.cctv_brand) || formatBookingServiceType(detail.service_type) : detail.guard_type || detail.repair_subcategory_name || detail.repair_category_name || formatBookingServiceType(detail.service_type)}</div>
                {detail.warranty_label || formatWarrantyLabel(detail.warranty_duration_value, detail.warranty_duration_unit) ? (
                  <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">{detail.warranty_label || formatWarrantyLabel(detail.warranty_duration_value, detail.warranty_duration_unit)}</div>
                ) : null}
                <div className="mt-2 text-muted-foreground">Booked on {new Date(detail.created_at).toLocaleString("en-IN")}</div>
                {detail.notes ? <div className="mt-2 text-muted-foreground">{detail.notes}</div> : null}
              </div>
              <div className="rounded-2xl border border-border/70 p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Technician inspection</div>
                  {detailInspection ? (
                    <div className="flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-black text-primary">{formatBookingStatus(detailInspection.status)}</span>
                      {detailInspection.customer_approval ? <span className="rounded-full bg-secondary px-2 py-1 text-[10px] font-black text-foreground">{formatBookingStatus(detailInspection.customer_approval)}</span> : null}
                    </div>
                  ) : null}
                </div>
                {detailInspection ? (
                  <div className="mt-3 space-y-3">
                    <div>
                      <div className="mb-1 text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">Issue / survey</div>
                      {renderInspectionText(detailInspection.reported_issue)}
                    </div>
                    <div>
                      <div className="mb-1 text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">Condition / diagnostics</div>
                      {renderInspectionText(detailInspection.device_condition)}
                    </div>
                    <div>
                      <div className="mb-1 text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">Accessories / material</div>
                      {renderInspectionText(detailInspection.accessories_received)}
                    </div>
                    {detailInspection.pickup_notes ? (
                      <div>
                        <div className="mb-1 text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">Pickup notes</div>
                        {renderInspectionText(detailInspection.pickup_notes)}
                      </div>
                    ) : null}
                    {detailInspection.quote_notes || detailInspection.quote_amount ? (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                        <div className="text-[11px] font-black uppercase tracking-[0.12em] text-emerald-700">Quote</div>
                        {detailInspection.quote_amount ? <div className="mt-1 text-base font-black text-emerald-800">₹{Number(detailInspection.quote_amount).toLocaleString("en-IN")}</div> : null}
                        {detailInspection.quote_notes ? <div className="mt-2 text-xs text-emerald-900">{renderInspectionText(detailInspection.quote_notes)}</div> : null}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-3 rounded-xl bg-secondary/60 px-3 py-4 text-center text-xs font-bold text-muted-foreground">No technician inspection submitted yet.</div>
                )}
              </div>
              <div className="rounded-2xl border border-border/70 p-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Technician assignment</div>
                    <div className="mt-2 text-foreground">Technician: {detail.assigned_rider ? technicianLabelByEmail.get(detail.assigned_rider) || detail.assigned_rider : "Unassigned"}</div>
                    {detail.assignment_notes ? <div className="mt-2 text-muted-foreground">{detail.assignment_notes}</div> : null}
                  </div>
                  <button type="button" onClick={() => openAssignment(detail)} disabled={detail.status === "completed"} title={detail.status === "completed" ? "Completed orders are locked" : "Assign technician"} className="rounded-xl border border-border px-3 py-2 text-xs font-bold text-foreground hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50">
                    {detail.status === "completed" ? "Locked" : "Assign"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showCreateOrder ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" onClick={() => setShowCreateOrder(false)}>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          <form onSubmit={submitCreateOrder} className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-border bg-card p-4 shadow-xl sm:max-w-3xl sm:rounded-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Create order</h3>
                <p className="text-xs text-muted-foreground">Select the customer, model, service, sub-service, schedule, and technician.</p>
              </div>
              <button type="button" onClick={() => setShowCreateOrder(false)} className="rounded-xl border border-border px-3 py-2 text-xs font-bold">Close</button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label htmlFor="field-bookingstab-667" className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground">Customer name</span>
                <Input id="field-bookingstab-667" value={createOrder.customerName} onChange={(event) => patchCreateOrder({ customerName: event.target.value })} required />
              </label>
              <label htmlFor="field-bookingstab-671" className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground">Customer phone</span>
                <Input id="field-bookingstab-671" value={createOrder.customerPhone} onChange={(event) => patchCreateOrder({ customerPhone: event.target.value })} required />
              </label>
              <label htmlFor="field-bookingstab-email" className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground">Customer email</span>
                <Input id="field-bookingstab-email" type="email" value={createOrder.customerEmail} onChange={(event) => patchCreateOrder({ customerEmail: event.target.value })} placeholder="customer@example.com" />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground">Service</span>
                <select value={createOrder.serviceType} onChange={(event) => handleCreateServiceChange(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground">
                  {orderServiceTypes.map((service) => (
                    <option key={service.value} value={service.value}>{service.label}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground">Status</span>
                <select value={createOrder.status} onChange={(event) => patchCreateOrder({ status: event.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground">
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>

              {createCatalogType ? (
                <>
                  <label className="space-y-1">
                    <span className="text-xs font-bold text-muted-foreground">Brand</span>
                    <select value={createOrder.brandId} onChange={(event) => patchCreateOrder({ brandId: event.target.value, seriesId: "", modelId: "" })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground">
                      <option value="">Select brand</option>
                      {createBrandOptions.map((brand) => (
                        <option key={brand.id} value={brand.id}>{brand.name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-bold text-muted-foreground">Series</span>
                    <select value={createOrder.seriesId} onChange={(event) => patchCreateOrder({ seriesId: event.target.value, modelId: "" })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground" disabled={!createOrder.brandId}>
                      <option value="">Select series</option>
                      {createSeriesOptions.map((series) => (
                        <option key={series.id} value={series.id}>{series.name || series.id}</option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-bold text-muted-foreground">Model</span>
                    <select value={createOrder.modelId} onChange={(event) => patchCreateOrder({ modelId: event.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground" disabled={!createOrder.seriesId}>
                      <option value="">Select model</option>
                      {createModelOptions.map((model) => (
                        <option key={model.id} value={model.id}>{model.name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-bold text-muted-foreground">Service category</span>
                    <select value={createOrder.repairCategoryId} onChange={(event) => patchCreateOrder({ repairCategoryId: event.target.value, repairSubcategoryId: "" })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground">
                      <option value="">No category</option>
                      {createCategoryOptions.map((category) => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1 sm:col-span-2">
                    <span className="text-xs font-bold text-muted-foreground">Sub-service</span>
                    <select value={createOrder.repairSubcategoryId} onChange={(event) => handleCreateSubcategoryChange(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground" disabled={!createOrder.repairCategoryId}>
                      <option value="">No sub-service</option>
                      {createSubcategoryOptions.map((subcategory) => (
                        <option key={subcategory.id} value={subcategory.id}>{subcategory.name}{subcategory.price ? ` - Rs. ${Number(subcategory.price).toLocaleString("en-IN")}` : ""}</option>
                      ))}
                    </select>
                  </label>
                </>
              ) : null}

              <label className="space-y-1 sm:col-span-2">
                <span className="text-xs font-bold text-muted-foreground">Address</span>
                <textarea value={createOrder.address} onChange={(event) => patchCreateOrder({ address: event.target.value })} rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground" placeholder="Customer inspect address" />
              </label>
              <label htmlFor="field-bookingstab-748" className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground">City</span>
                <Input id="field-bookingstab-748" value={createOrder.city} onChange={(event) => patchCreateOrder({ city: event.target.value })} />
              </label>
              <label htmlFor="field-bookingstab-752" className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground">Pincode</span>
                <Input id="field-bookingstab-752" value={createOrder.pincode} onChange={(event) => patchCreateOrder({ pincode: event.target.value })} />
              </label>
              <label htmlFor="field-bookingstab-756" className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground">Schedule date</span>
                <Input id="field-bookingstab-756" type="date" value={createOrder.scheduledDate} onChange={(event) => patchCreateOrder({ scheduledDate: event.target.value })} />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground">Time slot</span>
                <select value={createOrder.timeSlot} onChange={(event) => patchCreateOrder({ timeSlot: event.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground">
                  <option value="">No slot</option>
                  {timeSlots.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground">Technician</span>
                <select value={createOrder.assignedRider} onChange={(event) => patchCreateOrder({ assignedRider: event.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground">
                  <option value="">Unassigned</option>
                  {createEligibleTechnicians.map((technician) => (
                    <option key={technician.id} value={technician.email}>{technician.full_name || technician.email} - {getServiceTypeLabels(technician.service_types).join(", ")}</option>
                  ))}
                </select>
                {createEligibleTechnicians.length === 0 ? <span className="text-[11px] text-muted-foreground">No approved technicians support this service yet.</span> : null}
              </label>
              <label htmlFor="field-bookingstab-779" className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground">Assignment notes</span>
                <Input id="field-bookingstab-779" value={createOrder.assignmentNotes} onChange={(event) => patchCreateOrder({ assignmentNotes: event.target.value })} placeholder="Route or customer call note" />
              </label>
              <label className="space-y-1 sm:col-span-2">
                <span className="text-xs font-bold text-muted-foreground">Order notes</span>
                <textarea value={createOrder.notes} onChange={(event) => patchCreateOrder({ notes: event.target.value })} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground" placeholder="Issue description, customer request, accessories, or internal notes" />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground">Warranty</span>
                <select value={createOrder.warrantyPreset} onChange={(event) => patchCreateOrder({ warrantyPreset: event.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground">
                  {WARRANTY_PRESETS.map((preset) => <option key={preset.value} value={preset.value}>{preset.label}</option>)}
                </select>
              </label>
              {createOrder.warrantyPreset === "custom" ? (
                <div className="grid grid-cols-[1fr_130px] gap-2">
                  <label className="space-y-1">
                    <span className="text-xs font-bold text-muted-foreground">Duration</span>
                    <Input type="number" min="1" value={createOrder.warrantyValue} onChange={(event) => patchCreateOrder({ warrantyValue: event.target.value })} placeholder="30" />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-bold text-muted-foreground">Unit</span>
                    <select value={createOrder.warrantyUnit} onChange={(event) => patchCreateOrder({ warrantyUnit: event.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground">
                      {WARRANTY_UNITS.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                    </select>
                  </label>
                </div>
              ) : null}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => { resetCreateOrder(); setShowCreateOrder(false); }} className="rounded-xl border border-border px-4 py-2.5 text-xs font-bold">Cancel</button>
              <button type="submit" disabled={creatingOrder} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground disabled:opacity-60">
                {creatingOrder ? <Loader2 className="size-4 animate-spin" /> : <ClipboardPlus className="size-4" />}
                {creatingOrder ? "Creating..." : "Create Order"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {assignTarget ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" onClick={() => setAssignTarget(null)}>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full rounded-t-3xl border border-border bg-card p-4 shadow-xl sm:max-w-md sm:rounded-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4">
              <div className="text-base font-black text-foreground">Assign order</div>
              <div className="text-xs text-muted-foreground">{assignTarget.booking_code || assignTarget.customer_name} - {formatBookingServiceType(assignTarget.service_type)}</div>
            </div>
            <div className="space-y-3">
              <label className="block space-y-1">
                <span className="text-xs font-bold text-muted-foreground">Technician</span>
                <Input value={technicianSearch} onChange={(event) => setTechnicianSearch(event.target.value)} placeholder="Search eligible technician by name, email, phone, city, or service" />
                <select value={assignedRider} onChange={(event) => setAssignedRider(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground">
                  <option value="">Select technician manually&hellip;</option>
                  {filteredTechnicians.map((technician) => (
                    <option key={technician.id} value={technician.email}>
                      {technician.full_name || technician.email} - {technician.phone || technician.email} - {getServiceTypeLabels(technician.service_types).join(", ")}
                    </option>
                  ))}
                </select>
                {assignedRider ? (
                  <button type="button" onClick={() => setAssignedRider("")} className="text-[11px] font-bold text-muted-foreground hover:text-destructive">Clear technician</button>
                ) : null}
                {technicians.length === 0 ? <span className="text-[11px] text-muted-foreground">Approve technicians first from the Technicians tab.</span> : null}
                {technicians.length > 0 && assignEligibleTechnicians.length === 0 ? <span className="text-[11px] text-amber-700">No approved technician supports {formatBookingServiceType(assignTarget.service_type)} yet.</span> : null}
                {assignEligibleTechnicians.length > 0 && filteredTechnicians.length === 0 ? <span className="text-[11px] text-muted-foreground">No eligible technicians match this search.</span> : null}
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-bold text-muted-foreground">Assignment notes</span>
                <textarea value={assignmentNotes} onChange={(event) => setAssignmentNotes(event.target.value)} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground" placeholder="Pickup note, route, customer call status" />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setAssignTarget(null)} className="rounded-xl border border-border px-4 py-2.5 text-xs font-bold">Cancel</button>
              <button type="button" onClick={saveAssignment} disabled={assigning} className="rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground disabled:opacity-60">
                {assigning ? "Saving..." : "Save assignment"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default BookingsTab;
