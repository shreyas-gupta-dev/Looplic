"use client";

import { CalendarCheck, CreditCard, Laptop, LogOut, Smartphone, Tag, UserRoundCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import BookingsTab from "@/src/components/admin/BookingsTab";
import PaymentsTab from "@/src/components/admin/PaymentsTab";
import { RepairPricingMatrixTab } from "@/src/components/admin/ServicesTab";
import TechniciansTab from "@/src/components/admin/TechniciansTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { useRoleSession } from "@/src/hooks/useRoleSession";

type OperationDashboardClientProps = {
  loginPath?: string;
};

function ModelPricingTab() {
  const [activeService, setActiveService] = useState("mobile");

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4">
        <h2 className="text-base font-semibold text-foreground">Model Pricing</h2>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Change exact repair subcategory pricing for any mobile or laptop model. These prices override the global subcategory price in the customer booking flow.
        </p>
      </div>

      <Tabs value={activeService} onValueChange={setActiveService} className="w-full">
        <TabsList className="flex !h-auto w-full max-w-full !justify-start gap-1 overflow-x-auto rounded-2xl p-1 sm:grid sm:max-w-sm sm:grid-cols-2 sm:overflow-visible">
          <TabsTrigger value="mobile" className="min-w-[116px] flex-shrink-0 gap-1.5 px-3 py-2.5 text-xs sm:min-w-0">
            <Smartphone className="size-3.5" />
            Mobile
          </TabsTrigger>
          <TabsTrigger value="laptop" className="min-w-[116px] flex-shrink-0 gap-1.5 px-3 py-2.5 text-xs sm:min-w-0">
            <Laptop className="size-3.5" />
            Laptop
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mobile">
          {activeService === "mobile" ? <RepairPricingMatrixTab serviceType="mobile" /> : null}
        </TabsContent>

        <TabsContent value="laptop">
          {activeService === "laptop" ? <RepairPricingMatrixTab serviceType="laptop" /> : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function OperationDashboardClient({ loginPath = "/operation/login" }: OperationDashboardClientProps) {
  const router = useRouter();
  const { user, hasRole, loading, signOut } = useRoleSession("operation");
  const [activeTab, setActiveTab] = useState("model-pricing");

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
              Operations
            </div>
            <div>
              <div className="text-sm font-extrabold text-foreground">Looplic Operation Desk</div>
              <div className="text-[10px] text-muted-foreground">{user.email}</div>
            </div>
          </div>
          <button onClick={handleSignOut} className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground">
            <LogOut className="size-3.5" />
            Logout
          </button>
        </div>
      </header>

      <div className="container py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex !h-auto w-full max-w-full !justify-start gap-1 overflow-x-auto rounded-2xl p-1 sm:grid sm:max-w-3xl sm:grid-cols-4 sm:overflow-visible">
            <TabsTrigger value="model-pricing" className="min-w-[116px] flex-shrink-0 gap-1.5 px-3 py-2.5 text-xs sm:min-w-0">
              <Tag className="size-3.5" />
              <span className="hidden sm:inline">Model Pricing</span>
              <span className="sm:hidden">Pricing</span>
            </TabsTrigger>
            <TabsTrigger value="bookings" className="min-w-[116px] flex-shrink-0 gap-1.5 px-3 py-2.5 text-xs sm:min-w-0">
              <CalendarCheck className="size-3.5" />
              <span className="hidden sm:inline">Order Management</span>
              <span className="sm:hidden">Orders</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="min-w-[116px] flex-shrink-0 gap-1.5 px-3 py-2.5 text-xs sm:min-w-0">
              <CreditCard className="size-3.5" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="technicians" className="min-w-[116px] flex-shrink-0 gap-1.5 px-3 py-2.5 text-xs sm:min-w-0">
              <UserRoundCheck className="size-3.5" />
              <span className="hidden sm:inline">Technicians</span>
              <span className="sm:hidden">Techs</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="model-pricing">
            {activeTab === "model-pricing" ? <ModelPricingTab /> : null}
          </TabsContent>

          <TabsContent value="bookings">
            {activeTab === "bookings" ? <BookingsTab role="operation" /> : null}
          </TabsContent>

          <TabsContent value="payments">
            {activeTab === "payments" ? <PaymentsTab role="operation" /> : null}
          </TabsContent>

          <TabsContent value="technicians">
            {activeTab === "technicians" ? <TechniciansTab /> : null}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
