import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import * as schema from "@/src/lib/db/schema";
import { and, asc, desc, eq, inArray, ne } from "drizzle-orm";
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
  technician_applications: schema.technicianApplications,
};

const PUBLIC_READ_TABLES = new Set([
  "brands", "series", "models", "repair_categories", "repair_subcategories",
  "model_repair_services", "model_screen_guards", "screen_guard_types",
  "screen_guard_categories", "app_settings", "model_repair_subcategory_prices",
  "user_roles",
]);

const PUBLIC_INSERT_TABLES = new Set(["bookings", "technician_applications"]);

// technician_applications is insert-only from this app (the technician signup
// form) — nothing in apps/user ever reads it back, so a select is rejected
// outright rather than left open to "any authenticated session" (which would
// otherwise let a customer read every applicant's name/phone/email).
const WRITE_ONLY_TABLES = new Set(["technician_applications"]);

// Tables a customer session may mutate through this proxy, and the column
// that must equal their own user id. Every update/upsert is force-scoped to
// this column server-side — the client's own filters/payload are never
// trusted to enforce ownership, since a forged request could otherwise edit
// or read another customer's booking/profile. Tables not listed here (e.g.
// service_bills, technician_applications) have no legitimate
// customer-initiated mutation today, so update/upsert on them is rejected
// outright.
const OWNED_TABLES: Record<string, string> = {
  bookings: "user_id",
  customer_profiles: "user_id",
};

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

// Builds a Drizzle column-projection object from a "col_a, col_b" select string.
// Returns undefined for "*"/empty (full row) so the caller selects everything.
function buildSelection(tbl: any, select?: string) {
  if (!select || select.trim() === "" || select.trim() === "*") return undefined;
  const projection: Record<string, any> = {};
  for (const raw of select.split(",")) {
    const col = raw.trim();
    if (!col || col === "*") return undefined; // a "*" anywhere means full row
    const colDef = tbl[snakeToCamel(col)];
    if (colDef) projection[snakeToCamel(col)] = colDef;
  }
  return Object.keys(projection).length > 0 ? projection : undefined;
}

function applyOrder(query: any, tbl: any, order: Array<[string, string]>) {
  const exprs = (order || [])
    .map(([col, dir]) => {
      const colDef = tbl[snakeToCamel(col)];
      if (!colDef) return null;
      return String(dir).toUpperCase() === "DESC" ? desc(colDef) : asc(colDef);
    })
    .filter(Boolean) as any[];
  return exprs.length > 0 ? query.orderBy(...exprs) : query;
}

function mapRowOut(row: any) {
  const out: any = {};
  for (const [k, v] of Object.entries(row)) {
    out[camelToSnake(k)] = v;
  }
  return out;
}

function mapRowIn(row: any, tbl: any) {
  const out: any = {};
  for (const [k, v] of Object.entries(row)) {
    const key = snakeToCamel(k);
    // Timestamp columns arrive as ISO strings from the browser, but drizzle's
    // node-postgres driver expects Date objects (it calls .toISOString()).
    out[key] = typeof v === "string" && tbl?.[key]?.dataType === "date" ? new Date(v) : v;
  }
  return out;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { table, op, payload, filters, inFilters, select, single, onConflict, order, limit } = body;

    const tbl = TABLE_MAP[table];
    if (!tbl) {
      return NextResponse.json({ error: { message: `Unknown table: ${table}` } }, { status: 400 });
    }

    const isRead = !op || op === "select";

    if (isRead) {
      let readFilters = filters;
      let readInFilters = inFilters;
      if (!PUBLIC_READ_TABLES.has(table)) {
        const session = await getServerSession();
        if (!session.user) {
          return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
        }
        if (WRITE_ONLY_TABLES.has(table)) {
          return NextResponse.json({ error: { message: "Reads of this table are not permitted from this app." } }, { status: 403 });
        }
        // For owned tables, force-scope every read to the caller's own rows —
        // whatever user_id filter the client sent (or omitted) is ignored, so
        // a forged request can't read another customer's booking/profile.
        const ownerColumn = OWNED_TABLES[table];
        if (ownerColumn) {
          readFilters = [...(filters || []), ["eq", ownerColumn, session.user.id]];
        } else if (table === "service_bills") {
          // service_bills has no direct user_id column — it's scoped through
          // the booking it belongs to. Ignore whatever booking_id filter the
          // client sent and force it to the caller's own booking ids, so a
          // forged request can't read another customer's invoice.
          const ownedBookings = await db
            .select({ id: schema.bookings.id })
            .from(schema.bookings)
            .where(eq(schema.bookings.userId, session.user.id));
          const ownedBookingIds = ownedBookings.map((row) => row.id);
          if (ownedBookingIds.length === 0) {
            return NextResponse.json({ data: single ? null : [] });
          }
          readInFilters = [["booking_id", ownedBookingIds]];
        }
      }

      const selection = buildSelection(tbl, select);
      let query = (selection ? db.select(selection).from(tbl) : db.select().from(tbl)) as any;
      query = applyFilters(query, tbl, readFilters, readInFilters);
      query = applyOrder(query, tbl, order);
      const effectiveLimit = single ? 1 : (typeof limit === "number" && limit > 0 ? limit : undefined);
      if (effectiveLimit) query = query.limit(effectiveLimit);
      const rows: any[] = await query;
      const mapped = rows.map(mapRowOut);
      return NextResponse.json({ data: single ? (mapped[0] ?? null) : mapped });
    }

    const session = await getServerSession();

    if (op === "insert") {
      if (!PUBLIC_INSERT_TABLES.has(table) && !session.user) {
        return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
      }

      const rows = Array.isArray(payload) ? payload.map((row: any) => mapRowIn(row, tbl)) : [mapRowIn(payload, tbl)];
      const inserted = await db.insert(tbl).values(rows).returning();
      return NextResponse.json({ data: inserted.map(mapRowOut) });
    }

    if (!session.user) {
      return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }

    if (op === "update") {
      const ownerColumn = OWNED_TABLES[table];
      if (!ownerColumn) {
        return NextResponse.json({ error: { message: "Updates to this table are not permitted from this app." } }, { status: 403 });
      }
      // Force-scope to the caller's own row regardless of the client-supplied
      // filters, so a forged filter (or a missing one) can't touch another
      // customer's row.
      const scopedFilters = [...(filters || []), ["eq", ownerColumn, session.user.id]];
      let query = db.update(tbl).set(mapRowIn(payload, tbl)) as any;
      query = applyFilters(query, tbl, scopedFilters, inFilters);
      const updated = await query.returning();
      return NextResponse.json({ data: updated.map(mapRowOut) });
    }

    if (op === "delete") {
      // No legitimate customer-initiated delete exists in this app today.
      return NextResponse.json({ error: { message: "Delete is not permitted from this app." } }, { status: 403 });
    }

    if (op === "upsert") {
      const ownerColumn = OWNED_TABLES[table];
      if (!ownerColumn) {
        return NextResponse.json({ error: { message: "Upserts to this table are not permitted from this app." } }, { status: 403 });
      }
      const rows = Array.isArray(payload) ? payload.map((row: any) => mapRowIn(row, tbl)) : [mapRowIn(payload, tbl)];
      const ownerKey = snakeToCamel(ownerColumn);
      // Never trust a client-supplied owner id — force every upserted row to
      // belong to the caller, so a forged payload can't overwrite someone
      // else's profile/booking via onConflict.
      for (const row of rows) row[ownerKey] = session.user.id;
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
    // Drizzle wraps driver errors ("Failed query: ..."); the useful message
    // (e.g. "duplicate key value violates unique constraint ...") is on the
    // cause. Surface it so clients can branch on it.
    const message = err?.cause?.message || err.message;
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}
