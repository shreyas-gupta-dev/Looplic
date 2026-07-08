"use client";

import { CalendarCheck, CreditCard, Laptop, LogOut, Recycle, ShieldAlert, Smartphone, UserRoundCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import BookingsTab from "@/src/components/admin/BookingsTab";
import BuybackTab from "@/src/components/admin/BuybackTab";
import PaymentsTab from "@/src/components/admin/PaymentsTab";
import TechniciansTab from "@/src/components/admin/TechniciansTab";
import { LaptopRepairServicesTab, MobileRepairServicesTab } from "@/src/components/admin/ServicesTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { useRoleSession } from "@/src/hooks/useRoleSession";

type OperatorDashboardClientProps = {
  loginPath?: string;
};

// The operator console mirrors the full admin dashboard (all five management
// tabs) but is authorized against the "operation" role and renders every tab
// with delete controls hidden. Operators keep full create/edit access (and all
// admin-level features such as the order status dropdown) — only admins can
// delete records. Delete gating is driven by:
//   - role="admin" + canDelete={false} on BookingsTab / PaymentsTab (operators
//     keep admin features such as the order-status dropdown, minus delete)
//   - canDelete={false} on the repair services tabs and technicians tab
export function OperatorDashboardClient({ loginPath = "/operator/login" }: OperatorDashboardClientProps) {
  const router = useRouter();
  const { user, hasRole, loading, signOut } = useRoleSession("operation");
  const [activeTab, setActiveTab] = useState("mobile-repair");

  useEffect(() => {
    if (!loading && (!user || !hasRole)) {
      router.replace(loginPath);
    }
  }, [hasRole, loading, loginPath, router, user]);

  async function handleSignOut() {
    await signOut();
    router.replace(loginPath);
  }

  if (loading || !user || !hasRole) {
    return <main className="min-h-screen bg-background" />;
  }

  return (
    <main className="min-h-screen bg-background [&_svg.animate-spin]:hidden">
      <header className="sticky top-0 z-50 border-b border-border bg-card/90 backdrop-blur-lg">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
              Operator
            </div>
            <div>
              <div className="text-sm font-extrabold text-foreground">Looplic Operator Console</div>
              <div className="text-[10px] text-muted-foreground">{user.email}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              title="Deleting records is restricted to admins. You have full create and edit access."
              className="hidden items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-2.5 py-1 text-[10px] font-semibold text-muted-foreground sm:inline-flex"
            >
              <ShieldAlert className="size-3" />
              Delete is admin-only
            </span>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <LogOut className="size-3.5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="container py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex !h-auto w-full max-w-full !justify-start gap-1 overflow-x-auto rounded-2xl p-1 sm:grid sm:max-w-4xl sm:grid-cols-6 sm:overflow-visible">
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
          </TabsList>

          <TabsContent value="mobile-repair">
            {activeTab === "mobile-repair" ? <MobileRepairServicesTab canDelete={false} /> : null}
          </TabsContent>

          <TabsContent value="laptop-repair">
            {activeTab === "laptop-repair" ? <LaptopRepairServicesTab canDelete={false} /> : null}
          </TabsContent>

          <TabsContent value="buyback">
            {activeTab === "buyback" ? <BuybackTab canDelete={false} /> : null}
          </TabsContent>

          <TabsContent value="bookings">
            {activeTab === "bookings" ? <BookingsTab role="admin" canDelete={false} /> : null}
          </TabsContent>

          <TabsContent value="payments">
            {activeTab === "payments" ? <PaymentsTab role="admin" canDelete={false} /> : null}
          </TabsContent>

          <TabsContent value="technicians">
            {activeTab === "technicians" ? <TechniciansTab canDelete={false} /> : null}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
