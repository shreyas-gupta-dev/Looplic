import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import * as schema from "@/src/lib/db/schema";
import { and, eq, inArray, ne } from "drizzle-orm";
import { getServerSession } from "@/src/lib/auth/cognito-server";

const TABLE_MAP: Record<string, any> = {
  brands: schema.brands,
  series: schema.series,
  models: schema.models,
  repair_categories: schema.repairCategories,
  repair_subcategories: schema.repairSubcategories,
  model_repair_services: schema.modelRepairServices,
  model_screen_guards: schema.modelScreenGuards,
  screen_guard_types: schema.screenGuardTypes,
  screen_guard_categories: schema.screenGuardCategories,
  app_settings: schema.appSettings,
  model_repair_subcategory_prices: schema.modelRepairSubcategoryPrices,
  bookings: schema.bookings,
  user_roles: schema.userRoles,
  customer_profiles: schema.customerProfiles,
  service_bills: schema.serviceBills,
  booking_inspections: schema.bookingInspections,
  technician_applications: schema.technicianApplications,
};

const PUBLIC_READ_TABLES = new Set([
  "brands", "series", "models", "repair_categories", "repair_subcategories",
  "model_repair_services", "model_screen_guards", "screen_guard_types",
  "screen_guard_categories", "app_settings", "model_repair_subcategory_prices",
]);

const PUBLIC_INSERT_TABLES = new Set(["bookings", "technician_applications"]);

function snakeToCamel(s: string) {
  return s.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
}

function camelToSnake(s: string) {
  return s.replace(/([A-Z])/g, "_$1").toLowerCase();
}

function applyFilters(query: any, tbl: any, filters: Array<[string, string, any]>, inFilters: Array<[string, any[]]>) {
  const conditions: any[] = [];
  for (const [type, col, val] of (filters || [])) {
    const colDef = tbl[snakeToCamel(col)];
    if (!colDef) continue;
    if (type === "eq") conditions.push(eq(colDef, val));
    else if (type === "neq") conditions.push(ne(colDef, val));
  }
  for (const [col, vals] of (inFilters || [])) {
    const colDef = tbl[snakeToCamel(col)];
    if (colDef && vals?.length > 0) conditions.push(inArray(colDef, vals));
  }
  if (conditions.length === 1) return query.where(conditions[0]);
  if (conditions.length > 1) return query.where(and(...conditions));
  return query;
}

function mapRowOut(row: any) {
  const out: any = {};
  for (const [k, v] of Object.entries(row)) {
    out[camelToSnake(k)] = v;
  }
  return out;
}

function mapRowIn(row: any) {
  const out: any = {};
  for (const [k, v] of Object.entries(row)) {
    out[snakeToCamel(k)] = v;
  }
  return out;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { table, op, payload, filters, inFilters, select, single, onConflict } = body;

    const tbl = TABLE_MAP[table];
    if (!tbl) {
      return NextResponse.json({ error: { message: `Unknown table: ${table}` } }, { status: 400 });
    }

    const isRead = !op || op === "select";

    if (isRead) {
      if (!PUBLIC_READ_TABLES.has(table)) {
        const session = await getServerSession();
        if (!session.user) {
          return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
        }
      }

      let query = db.select().from(tbl) as any;
      query = applyFilters(query, tbl, filters, inFilters);
      const rows: any[] = await query;
      const mapped = rows.map(mapRowOut);
      return NextResponse.json({ data: single ? (mapped[0] ?? null) : mapped });
    }

    const session = await getServerSession();

    if (op === "insert") {
      if (!PUBLIC_INSERT_TABLES.has(table) && !session.user) {
        return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
      }

      const rows = Array.isArray(payload) ? payload.map(mapRowIn) : [mapRowIn(payload)];
      const inserted = await db.insert(tbl).values(rows).returning();
      return NextResponse.json({ data: inserted.map(mapRowOut) });
    }

    if (!session.user) {
      return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }

    if (op === "update") {
      let query = db.update(tbl).set(mapRowIn(payload)) as any;
      query = applyFilters(query, tbl, filters, inFilters);
      const updated = await query.returning();
      return NextResponse.json({ data: updated.map(mapRowOut) });
    }

    if (op === "delete") {
      let query = db.delete(tbl) as any;
      query = applyFilters(query, tbl, filters, inFilters);
      await query;
      return NextResponse.json({ data: null });
    }

    if (op === "upsert") {
      const rows = Array.isArray(payload) ? payload.map(mapRowIn) : [mapRowIn(payload)];
      const onConflictKey = onConflict ? snakeToCamel(onConflict) : null;
      const conflictTarget = onConflictKey ? tbl[onConflictKey] : null;
      let insertQuery: any = db.insert(tbl).values(rows);
      if (conflictTarget && rows.length > 0) {
        const setClause: any = {};
        for (const [key, value] of Object.entries(rows[0])) {
          if (key !== onConflictKey) setClause[key] = value;
        }
        insertQuery = insertQuery.onConflictDoUpdate({ target: conflictTarget, set: setClause });
      } else {
        insertQuery = insertQuery.onConflictDoNothing();
      }
      const upserted = await insertQuery.returning();
      return NextResponse.json({ data: upserted.map(mapRowOut) });
    }

    return NextResponse.json({ error: { message: "Unknown operation" } }, { status: 400 });
  } catch (err: any) {
    console.error("DB proxy error:", err);
    return NextResponse.json({ error: { message: err.message } }, { status: 500 });
  }
}
