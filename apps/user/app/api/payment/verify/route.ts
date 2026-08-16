import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { db } from "@/src/lib/db";
import { buyOrders } from "@/src/lib/db/schema";
import { eq } from "drizzle-orm";
import { getServerSupabase } from "@/src/lib/supabase/server";

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;

async function getUser() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// POST - Verify Razorpay payment and update order
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderCode } = await req.json();

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing payment verification parameters" }, { status: 400 });
  }

  try {
    // Verify signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Payment verification failed - invalid signature" }, { status: 400 });
    }

    // Update order status
    if (orderCode) {
      await db
        .update(buyOrders)
        .set({
          paymentStatus: "paid",
          paymentId: razorpay_payment_id,
          status: "confirmed",
          updatedAt: new Date(),
        })
        .where(eq(buyOrders.orderCode, orderCode));
    }

    return NextResponse.json({
      success: true,
      paymentId: razorpay_payment_id,
      message: "Payment verified successfully",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
