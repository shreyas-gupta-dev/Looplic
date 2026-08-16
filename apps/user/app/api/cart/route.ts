import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import { cartItems, products, productImages, brands } from "@/src/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { getServerSupabase } from "@/src/lib/supabase/server";

async function getUser() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// GET - fetch cart items for the logged-in user
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const items = await db
      .select({
        id: cartItems.id,
        productId: cartItems.productId,
        quantity: cartItems.quantity,
        productName: products.name,
        productSlug: products.slug,
        price: products.price,
        originalPrice: products.originalPrice,
        condition: products.condition,
        storage: products.storage,
        ram: products.ram,
        color: products.color,
        stock: products.stock,
        coverImageUrl: products.coverImageUrl,
        warrantyMonths: products.warrantyMonths,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, user.id));

    return NextResponse.json({ items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - add item to cart
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { productId, quantity = 1 } = await req.json();
  if (!productId) return NextResponse.json({ error: "productId is required" }, { status: 400 });

  try {
    // Check if already in cart
    const existing = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.userId, user.id), eq(cartItems.productId, productId)))
      .limit(1);

    if (existing.length > 0) {
      // Update quantity
      await db
        .update(cartItems)
        .set({ quantity: existing[0].quantity + quantity })
        .where(eq(cartItems.id, existing[0].id));
    } else {
      await db.insert(cartItems).values({
        userId: user.id,
        productId,
        quantity,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - update quantity
export async function PATCH(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { cartItemId, quantity } = await req.json();
  if (!cartItemId || quantity < 1) return NextResponse.json({ error: "Invalid params" }, { status: 400 });

  try {
    await db
      .update(cartItems)
      .set({ quantity })
      .where(and(eq(cartItems.id, cartItemId), eq(cartItems.userId, user.id)));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - remove item from cart
export async function DELETE(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { cartItemId } = await req.json();
  if (!cartItemId) return NextResponse.json({ error: "cartItemId required" }, { status: 400 });

  try {
    await db
      .delete(cartItems)
      .where(and(eq(cartItems.id, cartItemId), eq(cartItems.userId, user.id)));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
