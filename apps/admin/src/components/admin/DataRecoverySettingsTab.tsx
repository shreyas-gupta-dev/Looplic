import { useEffect, useState } from "react";
import { createClient } from "@/src/lib/data-client/client";
import { toast } from "sonner";
import {
  HardDrive,
  Save,
  Loader2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Phone,
  IndianRupee,
  Layers,
} from "lucide-react";

const dataClient = new Proxy({} as any, {
  get(_target, property) {
    return (createClient() as any)[property];
  },
});

type DataRecoveryConfig = {
  pricing: {
    evaluation_fee: number;
    hdd_base_price: number;
    ssd_base_price: number;
    raid_base_price: number;
  };
  turnaround: {
    standard_days: string;
    priority_days: string;
    emergency_hours: string;
  };
  emergency_phone: string;
  whatsapp_number: string;
  active_notice: string;
};

const DEFAULT_CONFIG: DataRecoveryConfig = {
  pricing: {
    evaluation_fee: 0,
    hdd_base_price: 2499,
    ssd_base_price: 3499,
    raid_base_price: 8499,
  },
  turnaround: {
    standard_days: "3-5 business days",
    priority_days: "24-48 hours",
    emergency_hours: "Same day / 24 hours",
  },
  emergency_phone: "+91 88844 45924",
  whatsapp_number: "918884445924",
  active_notice: "",
};

export default function DataRecoverySettingsTab() {
  const [config, setConfig] = useState<DataRecoveryConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [purging, setPurging] = useState(false);

  useEffect(() => {
    async function loadConfig() {
      setLoading(true);
      try {
        const { data, error } = await (dataClient.from("app_settings") as any)
          .select("value")
          .eq("key", "data_recovery_config")
          .maybeSingle();

        if (data && data.value) {
          const parsed = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
          setConfig({ ...DEFAULT_CONFIG, ...parsed });
        }
      } catch (err) {
        console.error("Failed to load data_recovery_config:", err);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        key: "data_recovery_config",
        value: JSON.stringify(config),
        updated_at: new Date().toISOString(),
      };

      const { error } = await (dataClient.from("app_settings") as any).upsert(payload);
      if (error) {
        throw new Error(error.message);
      }

      // Trigger cache revalidation on /data-recovery
      await fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paths: ["/data-recovery", "/"],
          tags: ["data-recovery", "catalog"],
        }),
      });

      toast.success("Data Recovery settings saved & cache purged! Live on web & app.");
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const handlePurgeCache = async () => {
    setPurging(true);
    try {
      const res = await fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paths: ["/data-recovery", "/"],
          tags: ["data-recovery", "catalog"],
        }),
      });
      if (res.ok) {
        toast.success("Cache purged successfully! Latest content is live.");
      } else {
        toast.error("Failed to purge cache.");
      }
    } catch {
      toast.error("Network error purging cache.");
    } finally {
      setPurging(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <HardDrive className="size-5 text-primary" />
            <span>Data Recovery Lab Configuration</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage live pricing estimates, turnaround schedules, hotlines, and active announcements for /data-recovery.
          </p>
        </div>

        <button
          type="button"
          onClick={handlePurgeCache}
          disabled={purging}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
        >
          <RefreshCw className={`size-3.5 ${purging ? "animate-spin" : ""}`} />
          <span>Purge ISR Cache</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Baseline Pricing Estimates */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <IndianRupee className="size-4 text-primary" />
            <span>Starting Price Estimates (₹)</span>
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Evaluation Fee (₹)
              </label>
              <input
                type="number"
                value={config.pricing.evaluation_fee}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    pricing: { ...config.pricing, evaluation_fee: Number(e.target.value) },
                  })
                }
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground"
              />
              <span className="text-[10px] text-muted-foreground">0 = Free diagnostic evaluation</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                HDD Base Recovery (₹)
              </label>
              <input
                type="number"
                value={config.pricing.hdd_base_price}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    pricing: { ...config.pricing, hdd_base_price: Number(e.target.value) },
                  })
                }
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                SSD & NVMe Base Recovery (₹)
              </label>
              <input
                type="number"
                value={config.pricing.ssd_base_price}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    pricing: { ...config.pricing, ssd_base_price: Number(e.target.value) },
                  })
                }
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                RAID / Server Base Recovery (₹)
              </label>
              <input
                type="number"
                value={config.pricing.raid_base_price}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    pricing: { ...config.pricing, raid_base_price: Number(e.target.value) },
                  })
                }
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground"
              />
            </div>
          </div>
        </div>

        {/* 2. Turnaround Times */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Clock className="size-4 text-primary" />
            <span>Turnaround Time Tiers</span>
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Standard Queue Days
              </label>
              <input
                type="text"
                value={config.turnaround.standard_days}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    turnaround: { ...config.turnaround, standard_days: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Priority Queue Turnaround
              </label>
              <input
                type="text"
                value={config.turnaround.priority_days}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    turnaround: { ...config.turnaround, priority_days: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Emergency 24/7 Turnaround
              </label>
              <input
                type="text"
                value={config.turnaround.emergency_hours}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    turnaround: { ...config.turnaround, emergency_hours: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground"
              />
            </div>
          </div>
        </div>

        {/* 3. Emergency Hotline & WhatsApp */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Phone className="size-4 text-primary" />
            <span>Emergency Contacts & Live Notices</span>
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Lab Hotline Number
              </label>
              <input
                type="text"
                value={config.emergency_phone}
                onChange={(e) => setConfig({ ...config, emergency_phone: e.target.value })}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                WhatsApp Support Number (without +)
              </label>
              <input
                type="text"
                value={config.whatsapp_number}
                onChange={(e) => setConfig({ ...config, whatsapp_number: e.target.value })}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Active Banner Notice (Optional)
              </label>
              <input
                type="text"
                value={config.active_notice}
                onChange={(e) => setConfig({ ...config, active_notice: e.target.value })}
                placeholder="e.g. Free doorstep pickup on all enterprise RAID systems this month"
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Saving & Purging Cache...</span>
              </>
            ) : (
              <>
                <Save className="size-4" />
                <span>Save & Publish Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
