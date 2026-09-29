import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import * as schema from "@/src/lib/db/schema";
import { changeBookingStatus } from "@looplic/db/booking-status-events";
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
  booking_inspections: schema.bookingInspections,
  booking_status_events: schema.bookingStatusEvents,
  technician_applications: schema.technicianApplications,
  buyback_model_prices: schema.buybackModelPrices,
  buyback_model_variants: schema.buybackModelVariants,
  buyback_bookings: schema.buybackBookings,
  buyback_questions: schema.buybackQuestions,
  buyback_question_options: schema.buybackQuestionOptions,
  blog_posts: schema.blogPosts,
};

const PUBLIC_READ_TABLES = new Set([
  "brands", "series", "models", "repair_categories", "repair_subcategories",
  "model_repair_services", "model_screen_guards", "screen_guard_types",
  "screen_guard_categories", "app_settings", "model_repair_subcategory_prices",
  "user_roles",
  "buyback_model_prices", "buyback_model_variants", "buyback_questions", "buyback_question_options",
]);

const PUBLIC_INSERT_TABLES = new Set(["bookings", "technician_applications"]);

/**
 * `app_settings` keys a non-staff caller may read.
 *
 * `app_settings` is in PUBLIC_READ_TABLES because the storefront needs the
 * price-visibility switch before anyone signs in — but reads of public tables skip
 * the session check entirely, so every row in this key/value bag was readable by
 * anyone who could POST to this route.
 *
 * `repair_stream_centres` holds service-centre camera playlist URLs, which may
 * carry credentials. The repair-stream endpoints deliberately never disclose them;
 * this proxy did. Closed by default now: an allowlist, so a settings key added
 * later stays private unless someone deliberately publishes it.
 */
const PUBLIC_APP_SETTING_KEYS = new Set(["repair_subcategory_prices"]);

// Deleting records is an admin-only action. Operators (and the operation desk)
// share the "operation" role and get full create/edit access but must never
// delete. The only exception is clearing a per-model price override, which is
// part of the pricing-edit workflow available to operators — not a record
// deletion — so it stays allowed for any authenticated session.
const NON_ADMIN_DELETABLE_TABLES = new Set(["model_repair_subcategory_prices"]);

async function userIsAdmin(userId: string): Promise<boolean> {
  const rows = await db
    .select({ id: schema.userRoles.id })
    .from(schema.userRoles)
    .where(and(eq(schema.userRoles.userId, userId), eq(schema.userRoles.role, "admin")));
  return rows.length > 0;
}

// Staff = admin or operation. Any authenticated Supabase session (including an
// ordinary customer's, since sessions are shared across the looplic.com apps)
// used to be enough to read non-public tables and write updates through this
// proxy — this is the actual gate for those operations.
async function userIsStaff(userId: string): Promise<boolean> {
  const rows = await db
    .select({ id: schema.userRoles.id })
    .from(schema.userRoles)
    .where(and(eq(schema.userRoles.userId, userId), inArray(schema.userRoles.role, ["admin", "operation"])));
  return rows.length > 0;
}

function snakeToCamel(s: string) {
  return s.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
}

function camelToSnake(s: string) {
  return s.replace(/([A-Z])/g, "_$1").toLowerCase();
}

/**
 * Pulls the single booking id out of the client-supplied filters.
 *
 * A status change must name exactly one booking: applying one to a filtered set
 * would produce history that cannot be attributed, and is never something a
 * dashboard legitimately does.
 */
function findBookingIdFilter(filters: Array<[string, string, any]> | undefined): string | null {
  const matches = (filters || []).filter(([type, col]) => type === "eq" && (col === "id" || col === "booking_id"));
  if (matches.length !== 1) return null;

  const value = matches[0][2];
  return typeof value === "string" && value.trim() ? value.trim() : null;
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
      if (!PUBLIC_READ_TABLES.has(table)) {
        const session = await getServerSession();
        if (!session.user || !(await userIsStaff(session.user.id))) {
          return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
        }
      }

      const selection = buildSelection(tbl, select);
      let query = (selection ? db.select(selection).from(tbl) : db.select().from(tbl)) as any;
      query = applyFilters(query, tbl, filters, inFilters);
      query = applyOrder(query, tbl, order);
      const effectiveLimit = single ? 1 : (typeof limit === "number" && limit > 0 ? limit : undefined);
      if (effectiveLimit) query = query.limit(effectiveLimit);
      const rows: any[] = await query;
      const mapped = rows.map(mapRowOut);

      // Drop private settings unless the caller is staff. Filtering the result
      // rather than the query means it holds however the caller shaped their
      // filters, including no filter at all.
      if (table === "app_settings") {
        const session = await getServerSession();
        const isStaffReader = Boolean(session.user && (await userIsStaff(session.user.id)));
        if (!isStaffReader) {
          const visible = mapped.filter((row) => PUBLIC_APP_SETTING_KEYS.has(row.key));
          return NextResponse.json({ data: single ? (visible[0] ?? null) : visible });
        }
      }

      return NextResponse.json({ data: single ? (mapped[0] ?? null) : mapped });
    }

    const session = await getServerSession();

    if (op === "insert") {
      if (!PUBLIC_INSERT_TABLES.has(table) && (!session.user || !(await userIsStaff(session.user.id)))) {
        return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
      }

      const rows = Array.isArray(payload) ? payload.map((row: any) => mapRowIn(row, tbl)) : [mapRowIn(payload, tbl)];
      // `tbl` is resolved from TABLE_MAP at runtime, so Drizzle cannot infer the row
      // type here and types the result as a union including QueryResult<never>.
      const inserted = (await db.insert(tbl).values(rows).returning()) as Record<string, unknown>[];
      return NextResponse.json({ data: inserted.map(mapRowOut) });
    }

    if (!session.user || !(await userIsStaff(session.user.id))) {
      return NextResponse.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }

    if (op === "update") {
      // Booking status changes go through the shared helper so that every change
      // is validated against the canonical transition rules and appends a
      // booking_status_events row. Doing it here rather than in the dashboard
      // components means one implementation for all four apps, and a client
      // cannot skip the history by issuing a raw update.
      if (table === "bookings" && payload && typeof payload === "object" && "status" in payload) {
        const bookingId = findBookingIdFilter(filters);
        if (!bookingId) {
          return NextResponse.json(
            { error: { message: "A booking status change must target a single booking by id." } },
            { status: 400 },
          );
        }

        const { status, note, ...otherFields } = payload as Record<string, unknown>;
        const result = await changeBookingStatus(db as any, {
          bookingId,
          status: String(status),
          note: typeof note === "string" ? note : null,
          actorId: session.user.id,
          otherFields: mapRowIn(otherFields, tbl),
        });

        if (!result.ok) {
          return NextResponse.json(
                      { error: { message: result.message ?? "That status change is not allowed." } },
                      { status: result.status ?? 500 },
                    );
        }

        return NextResponse.json({ data: [mapRowOut(result.booking)] });
      }

      let query = db.update(tbl).set(mapRowIn(payload, tbl)) as any;
      query = applyFilters(query, tbl, filters, inFilters);
      const updated = await query.returning();
      return NextResponse.json({ data: updated.map(mapRowOut) });
    }

    if (op === "delete") {
      if (!NON_ADMIN_DELETABLE_TABLES.has(table) && !(await userIsAdmin(session.user.id))) {
        return NextResponse.json({ error: { message: "Only admins can delete records." } }, { status: 403 });
      }
      let query = db.delete(tbl) as any;
      query = applyFilters(query, tbl, filters, inFilters);
      await query;
      return NextResponse.json({ data: null });
    }

    if (op === "upsert") {
      const rows = Array.isArray(payload) ? payload.map((row: any) => mapRowIn(row, tbl)) : [mapRowIn(payload, tbl)];
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
