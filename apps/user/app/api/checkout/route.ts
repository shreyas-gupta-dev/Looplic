import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import { buyOrders, cartItems, products } from "@/src/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getServerSupabase } from "@/src/lib/supabase/server";

function generateOrderCode() {
  const prefix = "CSH";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

async function getUser() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// POST - place order from cart
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { shippingAddress, shippingCity, shippingPincode, paymentMethod = "online" } = body;

  if (!shippingAddress || !shippingPincode) {
    return NextResponse.json({ error: "Shipping address and pincode are required" }, { status: 400 });
  }

  try {
    // Fetch user's cart items with product details
    const items = await db
      .select({
        cartItemId: cartItems.id,
        productId: cartItems.productId,
        quantity: cartItems.quantity,
        price: products.price,
        stock: products.stock,
        productName: products.name,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, user.id));

    if (items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Validate stock
    for (const item of items) {
      if (item.stock < item.quantity) {
        return NextResponse.json(
          { error: `${item.productName} has only ${item.stock} units available` },
          { status: 400 }
        );
      }
    }

    // Create orders for each item
    const orders = [];
    for (const item of items) {
      const totalAmount = Number(item.price) * item.quantity;
      const orderCode = generateOrderCode();

      const [order] = await db.insert(buyOrders).values({
        orderCode,
        userId: user.id,
        productId: item.productId,
        quantity: item.quantity,
        totalAmount: totalAmount.toString(),
        shippingAddress,
        shippingCity: shippingCity || null,
        shippingPincode,
        paymentMethod,
        paymentStatus: paymentMethod === "cod" ? "pending" : "pending",
        status: "pending",
      }).returning();

      orders.push(order);

      // Reduce stock
      await db
        .update(products)
        .set({ stock: item.stock - item.quantity })
        .where(eq(products.id, item.productId));
    }

    // Clear cart
    await db.delete(cartItems).where(eq(cartItems.userId, user.id));

    return NextResponse.json({
      success: true,
      orders: orders.map((o) => ({ orderCode: o.orderCode, id: o.id })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
