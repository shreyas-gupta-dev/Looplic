"use client";

import { BarChart3, CalendarCheck, CreditCard, Laptop, LogOut, Newspaper, Package, Recycle, Smartphone, UserRoundCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import BlogTab from "@/src/components/admin/BlogTab";
import BookingsTab from "@/src/components/admin/BookingsTab";
import BuybackTab from "@/src/components/admin/BuybackTab";
import PaymentsTab from "@/src/components/admin/PaymentsTab";
import ProductsTab from "@/src/components/admin/ProductsTab";
import TechniciansTab from "@/src/components/admin/TechniciansTab";
import { LaptopRepairServicesTab, MobileRepairServicesTab } from "@/src/components/admin/ServicesTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { useAdminSession } from "@/src/hooks/useAdminSession";

// ─── Analytics Dashboard Component ───────────────────────────────────────────
function AnalyticsTab() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0, buybackCount: 0, activeUsers: 0 });
  const [revenueByDay, setRevenueByDay] = useState<{ day: string; amount: number }[]>([]);
  const [ordersByType, setOrdersByType] = useState<{ type: string; count: number }[]>([]);
  const [recentActivity, setRecentActivity] = useState<{ action: string; detail: string; time: string; color: string }[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    setLoading(true);
    try {
      const [bookingsRes, billsRes, buybackRes, usersRes] = await Promise.all([
        fetch("/api/db-proxy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ table: "bookings", select: "id, service_type, customer_name, customer_phone, status, created_at" }) }),
        fetch("/api/db-proxy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ table: "service_bills", select: "id, total_amount, payment_status, customer_name, created_at" }) }),
        fetch("/api/db-proxy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ table: "buyback_bookings", select: "id, brand_name, model_name, quoted_amount, customer_name, status, created_at" }) }),
        fetch("/api/db-proxy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ table: "customer_profiles", select: "user_id" }) }),
      ]);

      const bookingsJson = await bookingsRes.json();
      const billsJson = await billsRes.json();
      const buybackJson = await buybackRes.json();
      const usersJson = await usersRes.json();

      const bookings: any[] = bookingsJson.data || [];
      const bills: any[] = billsJson.data || [];
      const buybackBookings: any[] = buybackJson.data || [];
      const users: any[] = usersJson.data || [];

      // Total revenue from paid bills
      const totalRevenue = bills
        .filter((b: any) => b.payment_status === "paid")
        .reduce((sum: number, b: any) => sum + Number(b.total_amount || 0), 0);

      setStats({
        totalRevenue,
        totalOrders: bookings.length,
        buybackCount: buybackBookings.length,
        activeUsers: users.length,
      });

      // Revenue by day (last 7 days)
      const now = new Date();
      const days: { day: string; label: string; amount: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        const dayLabel = d.toLocaleDateString("en-IN", { weekday: "short" });
        const dayRevenue = bills
          .filter((b: any) => b.payment_status === "paid" && b.created_at?.slice(0, 10) === dateStr)
          .reduce((sum: number, b: any) => sum + Number(b.total_amount || 0), 0);
        days.push({ day: dayLabel, label: dateStr, amount: dayRevenue });
      }
      setRevenueByDay(days);

      // Orders by service type
      const typeMap: Record<string, number> = {};
      bookings.forEach((b: any) => {
        const t = b.service_type || "other";
        typeMap[t] = (typeMap[t] || 0) + 1;
      });
      // Add buyback bookings
      typeMap["buyback"] = (typeMap["buyback"] || 0) + buybackBookings.length;
      const typeEntries = Object.entries(typeMap)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count);
      setOrdersByType(typeEntries);

      // Recent activity (last 10 combined events)
      const activities: { action: string; detail: string; time: string; color: string; timestamp: number }[] = [];

      bookings.slice(0, 20).forEach((b: any) => {
        const createdAt = new Date(b.created_at);
        activities.push({
          action: `New ${formatServiceTypeShort(b.service_type)} booking`,
          detail: `${b.customer_name} — ${b.customer_phone}`,
          time: formatRelativeTime(createdAt),
          color: "bg-blue-500",
          timestamp: createdAt.getTime(),
        });
      });

      buybackBookings.slice(0, 10).forEach((b: any) => {
        const createdAt = new Date(b.created_at);
        activities.push({
          action: "Buyback booking",
          detail: `${b.brand_name} ${b.model_name}${b.quoted_amount ? ` — ₹${Number(b.quoted_amount).toLocaleString("en-IN")}` : ""}`,
          time: formatRelativeTime(createdAt),
          color: "bg-green-500",
          timestamp: createdAt.getTime(),
        });
      });

      bills.slice(0, 10).forEach((b: any) => {
        const createdAt = new Date(b.created_at);
        activities.push({
          action: `Payment ${b.payment_status}`,
          detail: `${b.customer_name} — ₹${Number(b.total_amount || 0).toLocaleString("en-IN")}`,
          time: formatRelativeTime(createdAt),
          color: b.payment_status === "paid" ? "bg-purple-500" : "bg-orange-500",
          timestamp: createdAt.getTime(),
        });
      });

      activities.sort((a, b) => b.timestamp - a.timestamp);
      setRecentActivity(activities.slice(0, 10));
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setLoading(false);
    }
  }

  function formatServiceTypeShort(type: string) {
    const labels: Record<string, string> = {
      mobile_repair: "Mobile Repair",
      laptop_repair: "Laptop Repair",
      screen_guard: "Screen Guard",
      cctv: "CCTV",
      desktop_assembly: "Desktop",
      it_support: "IT Support",
      managed_it_services: "Managed IT",
      buyback: "Buyback",
    };
    return labels[type] || type;
  }

  function formatRelativeTime(date: Date) {
    const now = Date.now();
    const diff = now - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min${minutes > 1 ? "s" : ""} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString("en-IN");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }

  const maxRevenue = Math.max(...revenueByDay.map((d) => d.amount), 1);
  const maxTypeCount = Math.max(...ordersByType.map((t) => t.count), 1);
  const typeColors = ["bg-green-500", "bg-blue-500", "bg-purple-500", "bg-orange-500", "bg-pink-500", "bg-cyan-500", "bg-yellow-500"];

  return (
    <div className="space-y-6 py-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs font-medium text-muted-foreground">Total Revenue</p>
          <p className="mt-1 text-2xl font-bold text-foreground">₹{stats.totalRevenue.toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs font-medium text-muted-foreground">Total Orders</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{stats.totalOrders.toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs font-medium text-muted-foreground">Buyback Bookings</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{stats.buybackCount.toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs font-medium text-muted-foreground">Registered Users</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{stats.activeUsers.toLocaleString("en-IN")}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-bold text-foreground">Revenue Trend (Last 7 Days)</h3>
          {revenueByDay.every((d) => d.amount === 0) ? (
            <div className="mt-4 flex h-48 items-center justify-center text-xs text-muted-foreground">No revenue data in the last 7 days</div>
          ) : (
            <div className="mt-4 flex h-48 items-end gap-2">
              {revenueByDay.map((d, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <div className="w-full rounded-t-md bg-primary/80" style={{ height: `${Math.max((d.amount / maxRevenue) * 100, 2)}%` }} title={`₹${d.amount.toLocaleString("en-IN")}`} />
                  <span className="text-[10px] text-muted-foreground">{d.day}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-bold text-foreground">Orders by Type</h3>
          <div className="mt-4 space-y-3">
            {ordersByType.length === 0 ? (
              <div className="text-xs text-muted-foreground">No orders yet</div>
            ) : (
              ordersByType.map((entry, i) => (
                <div key={entry.type}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{formatServiceTypeShort(entry.type)}</span>
                    <span className="font-bold">{entry.count}</span>
                  </div>
                  <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-muted">
                    <div className={`h-full rounded-full ${typeColors[i % typeColors.length]}`} style={{ width: `${(entry.count / maxTypeCount) * 100}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-bold text-foreground">Recent Activity</h3>
        <div className="mt-4 space-y-3">
          {recentActivity.length === 0 ? (
            <div className="text-xs text-muted-foreground">No recent activity</div>
          ) : (
            recentActivity.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`size-2 rounded-full ${item.color}`} />
                <div className="flex-1">
                  <p className="text-xs font-medium text-foreground">{item.action}</p>
                  <p className="text-[11px] text-muted-foreground">{item.detail}</p>
                </div>
                <span className="text-[11px] text-muted-foreground">{item.time}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export function AdminDashboardClient() {
  const router = useRouter();
  const { user, isAdmin, loading, signOut } = useAdminSession();
  const [activeTab, setActiveTab] = useState("analytics");

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.replace("/admin/login");
    }
  }, [isAdmin, loading, router, user]);

  async function handleSignOut() {
    await signOut();
    router.replace("/admin/login");
  }

  if (loading || !user || !isAdmin) {
    return <main className="min-h-screen bg-background" />;
  }

  return (
    <main className="min-h-screen bg-background [&_svg.animate-spin]:hidden">
      <header className="sticky top-0 z-50 border-b border-border bg-card/90 backdrop-blur-lg">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
              Admin
            </div>
            <div>
              <div className="text-sm font-extrabold text-foreground">Looplic Dashboard</div>
              <div className="text-[10px] text-muted-foreground">{user.email}</div>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <LogOut className="size-3.5" />
            Logout
          </button>
        </div>
      </header>

      <div className="container py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex !h-auto w-full max-w-full !justify-start gap-1 overflow-x-auto rounded-2xl p-1 sm:grid sm:max-w-6xl sm:grid-cols-9 sm:overflow-visible">
            <TabsTrigger value="analytics" className="min-w-[104px] flex-shrink-0 gap-1.5 px-3 py-2.5 text-xs sm:min-w-0">
              <BarChart3 className="size-3.5" />
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden">Stats</span>
            </TabsTrigger>
            <TabsTrigger value="mobile-repair" className="min-w-[104px] flex-shrink-0 gap-1.5 px-3 py-2.5 text-xs sm:min-w-0">
              <Smartphone className="size-3.5" />
              <span className="hidden sm:inline">Mobile Repair</span>
              <span className="sm:hidden">Mobile</span>
            </TabsTrigger>
            <TabsTrigger value="laptop-repair" className="min-w-[104px] flex-shrink-0 gap-1.5 px-3 py-2.5 text-xs sm:min-w-0">
              <Laptop className="size-3.5" />
              <span className="hidden sm:inline">Laptop Repair</span>
              <span className="sm:hidden">Laptop</span>
            </TabsTrigger>
            <TabsTrigger value="buyback" className="min-w-[104px] flex-shrink-0 gap-1.5 px-3 py-2.5 text-xs sm:min-w-0">
              <Recycle className="size-3.5" />
              Buyback
            </TabsTrigger>
            <TabsTrigger value="bookings" className="min-w-[104px] flex-shrink-0 gap-1.5 px-3 py-2.5 text-xs sm:min-w-0">
              <CalendarCheck className="size-3.5" />
              <span className="hidden sm:inline">Order Management</span>
              <span className="sm:hidden">Orders</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="min-w-[104px] flex-shrink-0 gap-1.5 px-3 py-2.5 text-xs sm:min-w-0">
              <CreditCard className="size-3.5" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="technicians" className="min-w-[104px] flex-shrink-0 gap-1.5 px-3 py-2.5 text-xs sm:min-w-0">
              <UserRoundCheck className="size-3.5" />
              <span className="hidden sm:inline">Technicians</span>
              <span className="sm:hidden">Techs</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="min-w-[104px] flex-shrink-0 gap-1.5 px-3 py-2.5 text-xs sm:min-w-0">
              <Package className="size-3.5" />
              Products
            </TabsTrigger>
            <TabsTrigger value="blog" className="min-w-[104px] flex-shrink-0 gap-1.5 px-3 py-2.5 text-xs sm:min-w-0">
              <Newspaper className="size-3.5" />
              Blog
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            {activeTab === "analytics" ? <AnalyticsTab /> : null}
          </TabsContent>

          <TabsContent value="mobile-repair">
            {activeTab === "mobile-repair" ? <MobileRepairServicesTab /> : null}
          </TabsContent>

          <TabsContent value="laptop-repair">
            {activeTab === "laptop-repair" ? <LaptopRepairServicesTab /> : null}
          </TabsContent>

          <TabsContent value="buyback">
            {activeTab === "buyback" ? <BuybackTab /> : null}
          </TabsContent>

          <TabsContent value="bookings">
            {activeTab === "bookings" ? <BookingsTab role="admin" /> : null}
          </TabsContent>

          <TabsContent value="payments">
            {activeTab === "payments" ? <PaymentsTab role="admin" /> : null}
          </TabsContent>

          <TabsContent value="technicians">
            {activeTab === "technicians" ? <TechniciansTab /> : null}
          </TabsContent>

          <TabsContent value="products">
            {activeTab === "products" ? <ProductsTab /> : null}
          </TabsContent>

          <TabsContent value="blog">
            {activeTab === "blog" ? <BlogTab /> : null}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
