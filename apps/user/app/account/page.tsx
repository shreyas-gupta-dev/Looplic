import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck } from "lucide-react";

import { AccountPageClient } from "@/src/components/next/AccountPageClient";
import { BuybackStatusTimeline } from "@/src/components/next/BuybackStatusTimeline";
import { CatalogNavbar } from "@/src/components/next/CatalogNavbar";
import { HomepageFooter } from "@/src/components/next/HomepageFooter";
import { getBuybackBookingsForUser } from "@/src/lib/data/buyback-bookings";
import { buildPageMetadata } from "@/src/lib/metadata";
import { deviceDisplayName } from "@/src/lib/sell";
import { getServerSupabase } from "@/src/lib/supabase/server";

// Session-dependent (buyback orders section) — never cache one user's page.
export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "My Looplic Account",
  description: "View your Looplic bookings, check order status, and manage your account details in one place.",
  pathname: "/account",
  noIndex: true,
});

async function BuybackOrdersSection() {
  let bookings: Awaited<ReturnType<typeof getBuybackBookingsForUser>> = [];
  try {
    const supabase = await getServerSupabase();
    const { data } = await supabase.auth.getUser();
    if (data?.user?.id) {
      bookings = await getBuybackBookingsForUser(data.user.id);
    }
  } catch {
    // Signed-out or DB hiccup — the section simply doesn't render.
  }

  if (bookings.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold tracking-tight text-foreground">My Buyback Orders</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {bookings.map((booking) => (
          <div key={booking.bookingCode} className="rounded-3xl border border-border bg-card p-5">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[12px] font-bold tracking-widest text-primary">{booking.bookingCode}</div>
                <div className="mt-0.5 truncate text-[14px] font-bold text-foreground">
                  {deviceDisplayName(booking.brandName, booking.modelName)}
                  {booking.variantLabel ? ` (${booking.variantLabel})` : ""}
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
                  {booking.quotedAmount !== null ? (
                    <span>Quoted: <b className="text-primary">₹{booking.quotedAmount.toLocaleString("en-IN")}</b></span>
                  ) : null}
                  {booking.pickupDate || booking.timeSlot ? (
                    <span className="inline-flex items-center gap-1">
                      <CalendarCheck className="size-3.5" /> {[booking.pickupDate, booking.timeSlot].filter(Boolean).join(" · ")}
                    </span>
                  ) : null}
                </div>
              </div>
              <Link href={`/sell/booked/${booking.bookingCode}`} className="shrink-0 text-[12px] font-bold text-primary hover:underline">
                View
              </Link>
            </div>
            <BuybackStatusTimeline status={booking.status} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function AccountPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <CatalogNavbar />
      <AccountPageClient buybackOrders={<BuybackOrdersSection />} />
      <HomepageFooter />
    </div>
  );
}
