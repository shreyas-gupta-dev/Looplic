"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, Search, ShieldCheck, Trash2, UserRoundCheck, X } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/src/components/ui/input";
import { createClient } from "@/src/lib/supabase/client";
import { getServiceTypeLabels } from "@/src/lib/service-types";

type TechnicianApplication = {
  id: string;
  user_id: string | null;
  email: string;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  vehicle_type: string | null;
  experience: string | null;
  service_types?: string[] | null;
  status: string;
  review_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
};

const statusStyles: Record<string, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-800",
  rejected: "border-rose-200 bg-rose-50 text-rose-800",
};

export default function TechniciansTab() {
  const supabase = createClient() as any;
  const [applications, setApplications] = useState<TechnicianApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [reviewing, setReviewing] = useState<TechnicianApplication | null>(null);
  const [notes, setNotes] = useState("");
  const [busyId, setBusyId] = useState("");

  async function fetchApplications() {
    setLoading(true);
    setErrorMessage("");
    const { data, error } = await supabase
      .from("technician_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setApplications([]);
      setErrorMessage(error.message || "Unable to load technician applications.");
    } else {
      setApplications((data || []) as TechnicianApplication[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchApplications();
  }, []);

  const filteredApplications = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return applications.filter((application) => {
      const matchesStatus = statusFilter === "all" || application.status === statusFilter;
      const matchesQuery =
        !normalized ||
        [application.email, application.full_name, application.phone, application.city, application.vehicle_type, application.experience, ...getServiceTypeLabels(application.service_types)]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalized));
      return matchesStatus && matchesQuery;
    });
  }, [applications, query, statusFilter]);

  const counts = {
    pending: applications.filter((application) => application.status === "pending").length,
    approved: applications.filter((application) => application.status === "approved").length,
    rejected: applications.filter((application) => application.status === "rejected").length,
  };

  async function approve(application: TechnicianApplication) {
    if (!application.user_id) {
      toast.error("This application is missing a user id. Ask the technician to re-apply after signup.");
      return;
    }

    setBusyId(application.id);
    const roleResult = await supabase.from("user_roles").insert({
      user_id: application.user_id,
      role: "technician",
    });

    if (roleResult.error && !roleResult.error.message?.toLowerCase().includes("duplicate")) {
      setBusyId("");
      toast.error(roleResult.error.message || "Unable to assign technician role.");
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    const updateResult = await supabase
      .from("technician_applications")
      .update({
        status: "approved",
        review_notes: notes || application.review_notes,
        reviewed_by: userData?.user?.id || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", application.id);

    setBusyId("");
    if (updateResult.error) {
      toast.error(updateResult.error.message || "Role assigned, but application status was not updated.");
      return;
    }

    toast.success("Technician approved.");
    setReviewing(null);
    setNotes("");
    fetchApplications();
  }

  async function reject(application: TechnicianApplication) {
    setBusyId(application.id);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("technician_applications")
      .update({
        status: "rejected",
        review_notes: notes || application.review_notes,
        reviewed_by: userData?.user?.id || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", application.id);

    setBusyId("");
    if (error) {
      toast.error(error.message || "Unable to reject technician.");
      return;
    }

    toast.success("Technician rejected.");
    setReviewing(null);
    setNotes("");
    fetchApplications();
  }

  async function removeApplication(application: TechnicianApplication) {
    setBusyId(application.id);
    if (application.user_id) {
      await supabase.from("user_roles").delete().eq("user_id", application.user_id).eq("role", "technician");
    }
    const { error } = await supabase.from("technician_applications").delete().eq("id", application.id);
    setBusyId("");

    if (error) {
      toast.error(error.message || "Unable to remove technician application.");
      return;
    }

    toast.success("Technician removed.");
    fetchApplications();
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        {[
          { label: "Pending", value: counts.pending, icon: UserRoundCheck },
          { label: "Approved", value: counts.approved, icon: ShieldCheck },
          { label: "Rejected", value: counts.rejected, icon: X },
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
            <h2 className="text-base font-semibold text-foreground">Technician approvals</h2>
            <p className="text-xs text-muted-foreground">Review technician applications, approve access, reject incomplete profiles, or remove access.</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email, phone, city, vehicle" className="pl-9" />
          </div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground">
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center rounded-2xl border border-border/70 bg-card py-12"><Loader2 className="size-5 animate-spin text-primary" /></div>
      ) : errorMessage ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{errorMessage}</div>
      ) : filteredApplications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <p className="text-sm font-bold text-foreground">No technician applications</p>
          <p className="mt-1 text-xs text-muted-foreground">Technician signups from the technician login page will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredApplications.map((application) => (
            <div key={application.id} className="rounded-2xl border border-border/70 bg-card p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusStyles[application.status] || "border-border bg-secondary text-foreground"}`}>{application.status}</span>
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-bold text-foreground">{new Date(application.created_at).toLocaleDateString("en-IN")}</span>
                  </div>
                  <div className="mt-2 text-base font-black text-foreground">{application.full_name || application.email}</div>
                  <div className="text-sm text-muted-foreground">{application.email}{application.phone ? ` • ${application.phone}` : ""}</div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {[application.city, application.vehicle_type, application.experience].filter(Boolean).join(" • ") || "No technician details added"}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {getServiceTypeLabels(application.service_types).map((service) => (
                      <span key={service} className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">{service}</span>
                    ))}
                  </div>
                  {application.review_notes ? <div className="mt-2 text-xs text-muted-foreground">Notes: {application.review_notes}</div> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => { setReviewing(application); setNotes(application.review_notes || ""); }} className="rounded-xl border border-border px-3 py-2 text-xs font-bold text-foreground hover:border-primary/30 hover:text-primary">
                    Review
                  </button>
                  {application.status === "approved" ? (
                    <button type="button" onClick={() => removeApplication(application)} disabled={busyId === application.id} className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50">
                      Remove
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {reviewing ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" onClick={() => setReviewing(null)}>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full rounded-t-3xl border border-border bg-card p-4 shadow-xl sm:max-w-lg sm:rounded-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-foreground">Review technician</h3>
              <p className="text-xs text-muted-foreground">{reviewing.email}</p>
            </div>
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-xl bg-secondary p-3"><span className="text-xs text-muted-foreground">Name</span><div className="font-bold text-foreground">{reviewing.full_name || "Not provided"}</div></div>
              <div className="rounded-xl bg-secondary p-3"><span className="text-xs text-muted-foreground">Phone</span><div className="font-bold text-foreground">{reviewing.phone || "Not provided"}</div></div>
              <div className="rounded-xl bg-secondary p-3"><span className="text-xs text-muted-foreground">City</span><div className="font-bold text-foreground">{reviewing.city || "Not provided"}</div></div>
              <div className="rounded-xl bg-secondary p-3"><span className="text-xs text-muted-foreground">Vehicle</span><div className="font-bold text-foreground">{reviewing.vehicle_type || "Not provided"}</div></div>
            </div>
            <div className="mt-3 rounded-xl bg-secondary p-3 text-sm">
              <span className="text-xs text-muted-foreground">Services</span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {getServiceTypeLabels(reviewing.service_types).map((service) => (
                  <span key={service} className="rounded-full bg-card px-2.5 py-1 text-[11px] font-bold text-foreground">{service}</span>
                ))}
              </div>
            </div>
            <label className="mt-3 block space-y-1">
              <span className="text-xs font-bold text-muted-foreground">Review notes</span>
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground" placeholder="Why approved/rejected, documents pending, area preference" />
            </label>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => setReviewing(null)} className="rounded-xl border border-border px-4 py-2.5 text-xs font-bold">Close</button>
              <button type="button" onClick={() => reject(reviewing)} disabled={busyId === reviewing.id} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-xs font-bold text-rose-700 disabled:opacity-60">
                <X className="size-4" /> Reject
              </button>
              <button type="button" onClick={() => approve(reviewing)} disabled={busyId === reviewing.id} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground disabled:opacity-60">
                <Check className="size-4" /> Approve
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
