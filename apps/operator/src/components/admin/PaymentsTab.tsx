"use client";

import { useEffect, useMemo, useState } from "react";
import { CreditCard, Download, FileText, IndianRupee, Loader2, Mail, Plus, ReceiptText, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/src/components/ui/input";
import { formatBookingServiceType, type BookingRow } from "@/src/lib/bookings";
import { downloadInvoicePdf } from "@/src/lib/invoice-pdf";
import { createClient } from "@/src/lib/data-client/client";
import { buildWarrantyFields, formatWarrantyLabel, getWarrantyPreset, WARRANTY_PRESETS, WARRANTY_UNITS } from "@/src/lib/warranty";

type Bill = {
  id: string;
  booking_id: string | null;
  invoice_number: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  customer_address: string | null;
  invoice_emailed_at: string | null;
  service_type: string;
  repair_category_id: string | null;
  repair_subcategory_id: string | null;
  description: string | null;
  amount: number;
  discount: number;
  tax: number;
  total_amount: number;
  payment_status: string;
  payment_mode: string | null;
  notes: string | null;
  warranty_duration_value?: number | null;
  warranty_duration_unit?: string | null;
  warranty_label?: string | null;
  created_at: string;
};

type Category = { id: string; name: string; service_type: string };
type Subcategory = { id: string; category_id: string; name: string; price: number };
type PaymentsTabProps = {
  role?: "admin" | "operation";
  // Explicit override for the delete control; defaults to role-based (admin
  // only). The operator console passes canDelete={false}.
  canDelete?: boolean;
};

const paymentStatuses = ["unpaid", "paid", "partial", "cancelled"] as const;

function todayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function money(value: number | string | null | undefined) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function isMissingServiceBillsTable(error: { message?: string } | null | undefined) {
  return Boolean(error?.message && (error.message.includes("service_bills") || error.message.includes("schema cache")));
}

export default function PaymentsTab({ role = "operation", canDelete }: PaymentsTabProps) {
  const dataClient = createClient() as any;
  const canDeleteBills = canDelete ?? role === "admin";
  const [bills, setBills] = useState<Bill[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [bookingId, setBookingId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [serviceType, setServiceType] = useState("mobile_repair");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [discount, setDiscount] = useState("");
  const [tax, setTax] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("unpaid");
  const [paymentMode, setPaymentMode] = useState("");
  const [warrantyPreset, setWarrantyPreset] = useState("none");
  const [warrantyValue, setWarrantyValue] = useState("");
  const [warrantyUnit, setWarrantyUnit] = useState("months");
  const [saving, setSaving] = useState(false);

  async function fetchData() {
    setLoading(true);
    setErrorMessage("");

    const [billResult, bookingResult, catalogResult] = await Promise.all([
      dataClient.from("service_bills").select("*").order("created_at", { ascending: false }),
      dataClient.from("bookings").select("*").order("created_at", { ascending: false }).limit(200),
      fetch("/api/catalog/repair-options").then((response) => response.ok ? response.json() : { categories: [], subcategories: [] }).catch(() => ({ categories: [], subcategories: [] })),
    ]);

    if (billResult.error) {
      setErrorMessage(
        isMissingServiceBillsTable(billResult.error)
          ? "Billing is not set up yet. Apply the database migration 20260515120000_add_operations_billing_workflow.sql, then refresh the schema cache."
          : billResult.error.message || "Unable to load billing table.",
      );
      setBills([]);
    } else {
      setBills((billResult.data || []) as Bill[]);
    }

    setBookings((bookingResult.data || []) as BookingRow[]);
    setCategories((catalogResult.categories || []) as Category[]);
    setSubcategories((catalogResult.subcategories || []) as Subcategory[]);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  const categoryOptions = useMemo(() => {
    const key = serviceType.replace("_repair", "");
    return categories.filter((category) => category.service_type === key);
  }, [categories, serviceType]);

  const subcategoryOptions = useMemo(() => subcategories.filter((subcategory) => subcategory.category_id === categoryId), [categoryId, subcategories]);

  const uniqueBills = useMemo(() => {
    const seenBookings = new Set<string>();
    return bills.filter((bill) => {
      if (!bill.booking_id) return true;
      if (seenBookings.has(bill.booking_id)) return false;
      seenBookings.add(bill.booking_id);
      return true;
    });
  }, [bills]);

  const filteredBills = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return uniqueBills.filter((bill) => {
      const matchesStatus = statusFilter === "all" || bill.payment_status === statusFilter;
      const matchesQuery =
        !normalized ||
        [bill.invoice_number, bill.customer_name, bill.customer_phone, bill.description, formatBookingServiceType(bill.service_type)]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalized));
      return matchesStatus && matchesQuery;
    });
  }, [query, statusFilter, uniqueBills]);

  const today = todayKey(new Date());
  const todayBills = uniqueBills.filter((bill) => bill.created_at?.slice(0, 10) === today);
  const paidBills = uniqueBills.filter((bill) => bill.payment_status === "paid");
  const todayEarning = todayBills.filter((bill) => bill.payment_status === "paid").reduce((sum, bill) => sum + Number(bill.total_amount || 0), 0);
  const unpaidTotal = uniqueBills.filter((bill) => bill.payment_status !== "paid" && bill.payment_status !== "cancelled").reduce((sum, bill) => sum + Number(bill.total_amount || 0), 0);

  function resetForm() {
    setBookingId("");
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setCustomerAddress("");
    setServiceType("mobile_repair");
    setCategoryId("");
    setSubcategoryId("");
    setDescription("");
    setAmount("");
    setDiscount("");
    setTax("");
    setPaymentStatus("unpaid");
    setPaymentMode("");
    setWarrantyPreset("none");
    setWarrantyValue("");
    setWarrantyUnit("months");
  }

  function applyBooking(id: string) {
    setBookingId(id);
    const booking = bookings.find((item) => item.id === id);
    if (!booking) {
      return;
    }
    setCustomerName(booking.customer_name || "");
    setCustomerPhone(booking.customer_phone || "");
    const bookingLocation = [booking.location, booking.pincode].filter(Boolean).join(" - ");
    if (bookingLocation) setCustomerAddress(bookingLocation);
    setServiceType(booking.service_type || "mobile_repair");
    setCategoryId(booking.repair_category_id || "");
    setSubcategoryId(booking.repair_subcategory_id || "");
    const bookingWithWarranty = booking as BookingRow & { warranty_duration_value?: number | null; warranty_duration_unit?: string | null };
    setWarrantyPreset(getWarrantyPreset(bookingWithWarranty.warranty_duration_value, bookingWithWarranty.warranty_duration_unit));
    setWarrantyValue(bookingWithWarranty.warranty_duration_value ? String(bookingWithWarranty.warranty_duration_value) : "");
    setWarrantyUnit(bookingWithWarranty.warranty_duration_unit || "months");
  }

  function applySubcategory(id: string) {
    setSubcategoryId(id);
    const subcategory = subcategories.find((item) => item.id === id);
    if (subcategory?.price && !amount) {
      setAmount(String(subcategory.price));
    }
    if (subcategory?.name && !description) {
      setDescription(subcategory.name);
    }
  }

  async function createBill(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!customerName.trim() || !serviceType || !amount) {
      toast.error("Add customer, service, and amount.");
      return;
    }

    setSaving(true);
    const { data: userData } = await dataClient.auth.getUser();
    const existingBill = bookingId ? bills.find((bill) => bill.booking_id === bookingId) : null;
    const warrantyFields = buildWarrantyFields({ preset: warrantyPreset, value: warrantyValue, unit: warrantyUnit });
    const billPayload = {
      booking_id: bookingId || null,
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim() || null,
      customer_email: customerEmail.trim() || null,
      customer_address: customerAddress.trim() || null,
      service_type: serviceType,
      repair_category_id: categoryId || null,
      repair_subcategory_id: subcategoryId || null,
      description: description.trim() || null,
      amount: Number(amount || 0),
      discount: Number(discount || 0),
      tax: Number(tax || 0),
      payment_status: paymentStatus,
      payment_mode: paymentMode || null,
      ...warrantyFields,
      created_by: userData?.user?.id || null,
    };
    let savedBillId = existingBill?.id || "";
    let error: { message?: string } | null = null;
    if (existingBill) {
      ({ error } = await dataClient.from("service_bills").update(billPayload).eq("id", existingBill.id));
    } else {
      const inserted = await dataClient.from("service_bills").insert({ ...billPayload, invoice_number: "" }).select("id").single();
      error = inserted.error;
      savedBillId = inserted.data?.id || "";
    }

    setSaving(false);
    if (error) {
      toast.error(error.message || "Unable to create bill.");
      return;
    }

    toast.success(existingBill ? "Bill updated." : "Bill generated.");
    setShowCreate(false);
    resetForm();
    // A bill created/updated straight to "paid" emails the invoice immediately.
    if (paymentStatus === "paid" && savedBillId) {
      void emailInvoice(savedBillId, { silent: true });
    }
    fetchData();
  }

  // Emails the final invoice PDF for a paid bill. The server route re-checks the
  // paid status and only sends once, so double clicks and repeated status flips
  // never send duplicates. `silent` suppresses the "no email on file" toast for
  // automatic sends (e.g. right after marking paid).
  async function emailInvoice(billId: string, options?: { silent?: boolean; force?: boolean }) {
    try {
      const response = await fetch("/api/bills/send-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billId, force: options?.force }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) {
        if (!options?.silent) toast.error(data?.error || "Unable to email the invoice.");
        return;
      }
      if (data.emailed) {
        toast.success(`Invoice emailed to ${data.to}.`);
        fetchData();
      } else if (!options?.silent) {
        toast.message(data.message || "Invoice was not emailed.");
      }
    } catch (err) {
      if (!options?.silent) toast.error(err instanceof Error ? err.message : "Unable to email the invoice.");
    }
  }

  async function updatePaymentStatus(bill: Bill, nextStatus: string) {
    setBills((current) => current.map((item) => (item.id === bill.id ? { ...item, payment_status: nextStatus } : item)));
    const { error } = await dataClient.from("service_bills").update({ payment_status: nextStatus }).eq("id", bill.id);
    if (error) {
      toast.error(error.message || "Unable to update payment.");
      fetchData();
      return;
    }
    toast.success("Payment updated.");
    // Marking a bill paid triggers the automatic invoice email to the customer.
    if (nextStatus === "paid") {
      void emailInvoice(bill.id, { silent: true });
    }
  }

  async function deleteBill(bill: Bill) {
    if (!canDeleteBills) return;
    const label = bill.invoice_number || bill.id;
    if (!window.confirm(`Delete invoice ${label}? This cannot be undone.`)) {
      return;
    }

    const previousBills = bills;
    setBills((current) => current.filter((item) => item.id !== bill.id));
    const { error } = await dataClient.from("service_bills").delete().eq("id", bill.id);
    if (error) {
      setBills(previousBills);
      toast.error(error.message || "Unable to delete bill.");
      return;
    }

    toast.success("Bill deleted.");
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        {[
          { label: "Today earning", value: money(todayEarning), icon: IndianRupee },
          { label: "Paid invoices", value: paidBills.length, icon: CreditCard },
          { label: "Unpaid amount", value: money(unpaidTotal), icon: ReceiptText },
          { label: "Bills today", value: todayBills.length, icon: FileText },
        ].map((stat) => {
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
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">Billing and invoices</h2>
            <p className="text-xs text-muted-foreground">Create bills from bookings or standalone service work, then track payment collection.</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground">
            <Plus className="size-4" /> Create bill
          </button>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search invoice, customer, phone, or service" className="pl-9" />
          </div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground">
            <option value="all">All payment statuses</option>
            {paymentStatuses.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center rounded-2xl border border-border/70 bg-card py-12"><Loader2 className="size-5 animate-spin text-primary" /></div>
      ) : errorMessage ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{errorMessage}</div>
      ) : filteredBills.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <p className="text-sm font-bold text-foreground">No bills found</p>
          <p className="mt-1 text-xs text-muted-foreground">Create the first bill once an order or service form arrives.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBills.map((bill) => (
            <div key={bill.id} className="rounded-2xl border border-border/70 bg-card p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">{bill.invoice_number}</span>
                    <span className="rounded-full border border-border bg-secondary px-2.5 py-1 text-[11px] font-bold text-foreground">{bill.payment_status}</span>
                  </div>
                  <div className="mt-2 text-base font-black text-foreground">{bill.customer_name}</div>
                  <div className="text-sm text-muted-foreground">{formatBookingServiceType(bill.service_type)}{bill.description ? ` • ${bill.description}` : ""}</div>
                  {bill.warranty_label || formatWarrantyLabel(bill.warranty_duration_value, bill.warranty_duration_unit) ? (
                    <div className="mt-2 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700">{bill.warranty_label || formatWarrantyLabel(bill.warranty_duration_value, bill.warranty_duration_unit)}</div>
                  ) : null}
                  <div className="mt-1 text-xs text-muted-foreground">{new Date(bill.created_at).toLocaleString("en-IN")}</div>
                </div>
                <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Total</div>
                    <div className="text-xl font-black text-foreground">{money(bill.total_amount)}</div>
                  </div>
                  <select value={bill.payment_status} onChange={(event) => updatePaymentStatus(bill, event.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-xs text-foreground">
                    {paymentStatuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => downloadInvoicePdf(bill)} className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary" title="Download invoice PDF">
                    <Download className="size-4" />
                  </button>
                  <button type="button" onClick={() => emailInvoice(bill.id, { force: Boolean(bill.invoice_emailed_at) })} className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary" title={bill.invoice_emailed_at ? `Invoice emailed ${new Date(bill.invoice_emailed_at).toLocaleString("en-IN")} — click to resend` : "Email invoice PDF to customer"}>
                    <Mail className={`size-4 ${bill.invoice_emailed_at ? "text-emerald-600" : ""}`} />
                  </button>
                  {canDeleteBills ? (
                    <button type="button" onClick={() => deleteBill(bill)} className="inline-flex size-9 items-center justify-center rounded-lg border border-rose-200 text-rose-600 transition-colors hover:bg-rose-50" title="Delete invoice">
                      <Trash2 className="size-4" />
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" onClick={() => setShowCreate(false)}>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          <form onSubmit={createBill} className="relative max-h-[90vh] w-full overflow-y-auto rounded-t-3xl border border-border bg-card p-4 shadow-xl sm:max-w-2xl sm:rounded-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Create bill</h3>
                <p className="text-xs text-muted-foreground">Select an order or enter service billing details manually.</p>
              </div>
              <button type="button" onClick={() => setShowCreate(false)} className="rounded-xl border border-border px-3 py-2 text-xs font-bold">Close</button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 sm:col-span-2">
                <span className="text-xs font-bold text-muted-foreground">Order</span>
                <select value={bookingId} onChange={(event) => applyBooking(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground">
                  <option value="">Standalone bill</option>
                  {bookings.map((booking) => (
                    <option key={booking.id} value={booking.id}>{booking.booking_code || booking.id} - {booking.customer_name}</option>
                  ))}
                </select>
              </label>
              <label htmlFor="field-paymentstab-371" className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground">Customer</span>
                <Input id="field-paymentstab-371" value={customerName} onChange={(event) => setCustomerName(event.target.value)} required />
              </label>
              <label htmlFor="field-paymentstab-375" className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground">Phone</span>
                <Input id="field-paymentstab-375" value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} />
              </label>
              <label htmlFor="field-paymentstab-email" className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground">Email (for invoice delivery)</span>
                <Input id="field-paymentstab-email" type="email" value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} placeholder="customer@example.com" />
              </label>
              <label htmlFor="field-paymentstab-address" className="space-y-1 sm:col-span-2">
                <span className="text-xs font-bold text-muted-foreground">Billing address</span>
                <Input id="field-paymentstab-address" value={customerAddress} onChange={(event) => setCustomerAddress(event.target.value)} placeholder="Service / billing address for the invoice" />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground">Service</span>
                <select value={serviceType} onChange={(event) => { setServiceType(event.target.value); setCategoryId(""); setSubcategoryId(""); }} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground">
                  <option value="mobile_repair">Mobile Repair</option>
                  <option value="laptop_repair">Laptop Repair</option>
                  <option value="desktop_assembly">Desktop Assembly</option>
                  <option value="cctv">CCTV Installation</option>
                  <option value="it_support">IT Support</option>
                  <option value="managed_it_services">Managed IT Services</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground">Category</span>
                <select value={categoryId} onChange={(event) => { setCategoryId(event.target.value); setSubcategoryId(""); }} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground">
                  <option value="">No category</option>
                  {categoryOptions.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground">Subcategory</span>
                <select value={subcategoryId} onChange={(event) => applySubcategory(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground">
                  <option value="">No subcategory</option>
                  {subcategoryOptions.map((subcategory) => (
                    <option key={subcategory.id} value={subcategory.id}>{subcategory.name}{subcategory.price ? ` - ${money(subcategory.price)}` : ""}</option>
                  ))}
                </select>
              </label>
              <label htmlFor="field-paymentstab-408" className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground">Description</span>
                <Input id="field-paymentstab-408" value={description} onChange={(event) => setDescription(event.target.value)} />
              </label>
              <label htmlFor="field-paymentstab-412" className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground">Amount</span>
                <Input id="field-paymentstab-412" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} required />
              </label>
              <label htmlFor="field-paymentstab-416" className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground">Discount</span>
                <Input id="field-paymentstab-416" type="number" value={discount} onChange={(event) => setDiscount(event.target.value)} />
              </label>
              <label htmlFor="field-paymentstab-420" className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground">Tax</span>
                <Input id="field-paymentstab-420" type="number" value={tax} onChange={(event) => setTax(event.target.value)} />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground">Payment status</span>
                <select value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground">
                  {paymentStatuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </label>
              <label htmlFor="field-paymentstab-432" className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground">Payment mode</span>
                <Input id="field-paymentstab-432" value={paymentMode} onChange={(event) => setPaymentMode(event.target.value)} placeholder="Cash, UPI, card" />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground">Warranty</span>
                <select value={warrantyPreset} onChange={(event) => setWarrantyPreset(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground">
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
                    <select value={warrantyUnit} onChange={(event) => setWarrantyUnit(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground">
                      {WARRANTY_UNITS.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                    </select>
                  </label>
                </div>
              ) : null}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => { resetForm(); setShowCreate(false); }} className="rounded-xl border border-border px-4 py-2.5 text-xs font-bold">Cancel</button>
              <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground disabled:opacity-60">
                {saving ? <Loader2 className="size-4 animate-spin" /> : <ReceiptText className="size-4" />}
                Generate bill
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
