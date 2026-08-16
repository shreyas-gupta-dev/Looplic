import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/src/lib/db";
import { searchDevices } from "@/src/lib/whatsapp/booking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// TEMPORARY localhost preview: shows the priced repair menu for a model exactly
// as customers WILL see it once repair-price visibility is turned on — but reads
// straight from the DB and ignores the global visibility flag, so nothing is
// exposed to real customers. Delete after previewing.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") || "iphone 15 pro max";

  const matches = await searchDevices(q, "mobile", 1);
  if (matches.length === 0) return NextResponse.json({ q, error: "no model match" });
  const model = matches[0];

  // Fresh read: effective price = per-model override if present, else base price.
  const rows: any = await db.execute(sql`
    SELECT c.name AS category, sc.name AS subcategory,
           COALESCE(o.price, sc.price) AS price,
           (o.price IS NOT NULL) AS is_override
    FROM repair_subcategories sc
    JOIN repair_categories c ON c.id = sc.category_id
    LEFT JOIN model_repair_subcategory_prices o
      ON o.model_id = ${model.modelId} AND o.repair_subcategory_id = sc.id
    WHERE c.service_type = 'mobile'
      AND COALESCE(o.price, sc.price) > 0
    ORDER BY c.sort_order, price DESC
  `);
  const data = Array.isArray(rows) ? rows : rows.rows;

  const menu = data.map((r: any) => ({
    category: r.category,
    repair: r.subcategory,
    price: `₹${Number(r.price).toLocaleString("en-IN")}`,
    source: r.is_override ? "per-model" : "uniform",
  }));

  return NextResponse.json({
    model: model.label,
    pricedItems: menu.length,
    menu,
  });
}
