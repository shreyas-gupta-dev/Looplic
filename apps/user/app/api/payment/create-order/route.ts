import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/src/lib/supabase/server";

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID!;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;

async function getUser() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// POST - Create Razorpay order
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    return NextResponse.json({ error: "Payment gateway not configured" }, { status: 500 });
  }

  const { amount, currency = "INR", receipt, notes } = await req.json();

  if (!amount || amount < 100) {
    return NextResponse.json({ error: "Amount must be at least ₹1 (100 paise)" }, { status: 400 });
  }

  try {
    // Create Razorpay order via their API
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64")}`,
      },
      body: JSON.stringify({
        amount, // amount in paise
        currency,
        receipt: receipt || `rcpt_${Date.now()}`,
        notes: {
          userId: user.id,
          ...(notes || {}),
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error?.description || "Failed to create payment order" },
        { status: 400 }
      );
    }

    const order = await response.json();

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
