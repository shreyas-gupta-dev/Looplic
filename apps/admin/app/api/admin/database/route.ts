import { NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";

import { getServerSession } from "@/src/lib/auth/cognito-server";
import { db } from "@/src/lib/db";
import * as schema from "@/src/lib/db/schema";

async function verifyAdminAuth() {
  const session = await getServerSession();
  if (!session.user) {
    return { error: "Authentication required", status: 401 };
  }

  const roleRows = await db
    .select({ id: schema.userRoles.id })
    .from(schema.userRoles)
    .where(and(eq(schema.userRoles.userId, session.user.id), eq(schema.userRoles.role, "admin")));

  if (roleRows.length === 0) {
    return { error: "Admin role required", status: 403 };
  }

  return { currentUserId: session.user.id };
}

const ALL_TABLES: Record<string, { table: any; category: string; label: string; primaryKey: string }> = {
  products: { table: schema.products, category: "Catalog", label: "Products", primaryKey: "id" },
  product_images: { table: schema.productImages, category: "Catalog", label: "Product Images", primaryKey: "id" },
  brands: { table: schema.brands, category: "Catalog", label: "Brands", primaryKey: "id" },
  series: { table: schema.series, category: "Catalog", label: "Series", primaryKey: "id" },
  models: { table: schema.models, category: "Catalog", label: "Models", primaryKey: "id" },
  repair_categories: { table: schema.repairCategories, category: "Catalog", label: "Repair Categories", primaryKey: "id" },
  repair_subcategories: { table: schema.repairSubcategories, category: "Catalog", label: "Repair Subcategories", primaryKey: "id" },
  model_repair_services: { table: schema.modelRepairServices, category: "Catalog", label: "Model Repair Services", primaryKey: "id" },
  model_repair_subcategory_prices: { table: schema.modelRepairSubcategoryPrices, category: "Catalog", label: "Model Subcategory Prices", primaryKey: "id" },
  model_screen_guards: { table: schema.modelScreenGuards, category: "Catalog", label: "Model Screen Guards", primaryKey: "id" },
  screen_guard_types: { table: schema.screenGuardTypes, category: "Catalog", label: "Screen Guard Types", primaryKey: "id" },
  screen_guard_categories: { table: schema.screenGuardCategories, category: "Catalog", label: "Screen Guard Categories", primaryKey: "id" },
  bookings: { table: schema.bookings, category: "Orders", label: "Bookings", primaryKey: "id" },
  buy_orders: { table: schema.buyOrders, category: "Orders", label: "Buy Orders", primaryKey: "id" },
  cart_items: { table: schema.cartItems, category: "Orders", label: "Cart Items", primaryKey: "id" },
  service_bills: { table: schema.serviceBills, category: "Orders", label: "Service Bills", primaryKey: "id" },
  booking_inspections: { table: schema.bookingInspections, category: "Service", label: "Booking Inspections", primaryKey: "id" },
  booking_status_events: { table: schema.bookingStatusEvents, category: "Service", label: "Booking Status Events", primaryKey: "id" },
  buyback_model_prices: { table: schema.buybackModelPrices, category: "Buyback", label: "Buyback Model Prices", primaryKey: "id" },
  buyback_model_variants: { table: schema.buybackModelVariants, category: "Buyback", label: "Buyback Model Variants", primaryKey: "id" },
  buyback_bookings: { table: schema.buybackBookings, category: "Buyback", label: "Buyback Bookings", primaryKey: "id" },
  buyback_questions: { table: schema.buybackQuestions, category: "Buyback", label: "Buyback Questions", primaryKey: "id" },
  buyback_question_options: { table: schema.buybackQuestionOptions, category: "Buyback", label: "Buyback Options", primaryKey: "id" },
  customer_profiles: { table: schema.customerProfiles, category: "Users", label: "Customer Profiles", primaryKey: "userId" },
  user_roles: { table: schema.userRoles, category: "Users", label: "User Roles", primaryKey: "id" },
  technician_applications: { table: schema.technicianApplications, category: "Users", label: "Tech Applications", primaryKey: "id" },
  app_settings: { table: schema.appSettings, category: "Settings", label: "App Settings", primaryKey: "key" },
  blog_posts: { table: schema.blogPosts, category: "CMS", label: "Blog Posts", primaryKey: "id" },
  whatsapp_conversations: { table: schema.whatsappConversations, category: "Messaging", label: "WhatsApp Chats", primaryKey: "id" },
  whatsapp_messages: { table: schema.whatsappMessages, category: "Messaging", label: "WhatsApp Messages", primaryKey: "id" },
};

/**
 * GET /api/admin/database
 * Overview of tables & counts OR rows of a specific table.
 */
export async function GET(request: Request) {
  const auth = await verifyAdminAuth();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const tableName = searchParams.get("table");

  // 1. Overview Mode: List all tables with live row counts and connection stats
  if (action === "overview" || !tableName) {
    try {
      const startPing = Date.now();
      await db.execute(sql`SELECT 1`);
      const pingMs = Date.now() - startPing;

      const tableEntries = Object.entries(ALL_TABLES);
      const countPromises = tableEntries.map(async ([key, info]) => {
        try {
          const res = await db.select({ count: sql<number>`count(*)` }).from(info.table);
          return {
            key,
            label: info.label,
            category: info.category,
            primaryKey: info.primaryKey,
            rowCount: Number(res[0]?.count || 0),
          };
        } catch {
          return {
            key,
            label: info.label,
            category: info.category,
            primaryKey: info.primaryKey,
            rowCount: 0,
          };
        }
      });

      const tables = await Promise.all(countPromises);

      return NextResponse.json({
        success: true,
        stats: {
          host: (process.env.DATABASE_URL?.includes("supabase") ? "Supabase PostgreSQL (aws-1-ap-south-1.pooler.supabase.com)" : "looplic-db (PostgreSQL)"),
          region: "ap-south-1 (Mumbai)",
          ssl: true,
          status: "Connected",
          pingMs,
          totalTables: tables.length,
          totalRows: tables.reduce((acc, t) => acc + t.rowCount, 0),
        },
        tables,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Database overview failed";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  // 2. Table Data Mode: Query paginated rows for a specific table
  const tableConfig = ALL_TABLES[tableName];
  if (!tableConfig) {
    return NextResponse.json({ error: `Table '${tableName}' not recognized` }, { status: 404 });
  }

  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 50)));
  const offset = (page - 1) * limit;

  try {
    const table = tableConfig.table;
    const totalCountRes = await db.select({ count: sql<number>`count(*)` }).from(table);
    const total = Number(totalCountRes[0]?.count || 0);

    // Build query with optional order
    let query = db.select().from(table).limit(limit).offset(offset);

    // Order by createdAt if column exists
    if ("createdAt" in table) {
      query = query.orderBy(desc((table as any).createdAt)) as any;
    } else if ("created_at" in table) {
      query = query.orderBy(desc((table as any).created_at)) as any;
    }

    const rows = await query;
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

    return NextResponse.json({
      success: true,
      table: tableName,
      primaryKey: tableConfig.primaryKey,
      total,
      page,
      limit,
      columns,
      rows,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to query table";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/admin/database
 * Inserts a new row into the specified table.
 */
export async function POST(request: Request) {
  const auth = await verifyAdminAuth();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const tableName = searchParams.get("table");
  if (!tableName || !ALL_TABLES[tableName]) {
    return NextResponse.json({ error: "Invalid or missing table name" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const data = body.data || body;
    const table = ALL_TABLES[tableName].table;

    const inserted = await db.insert(table).values(data).returning();
    return NextResponse.json({ success: true, message: "Record inserted", inserted });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to insert record";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/database
 * Updates an existing row in the specified table.
 */
export async function PATCH(request: Request) {
  const auth = await verifyAdminAuth();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const tableName = searchParams.get("table");
  const id = searchParams.get("id");

  if (!tableName || !ALL_TABLES[tableName]) {
    return NextResponse.json({ error: "Invalid or missing table name" }, { status: 400 });
  }

  if (!id) {
    return NextResponse.json({ error: "Record ID is required" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const data = body.data || body;
    const tableConfig = ALL_TABLES[tableName];
    const table = tableConfig.table;
    const pkColumn = (table as any)[tableConfig.primaryKey];

    if (!pkColumn) {
      return NextResponse.json({ error: `Cannot update: primary key '${tableConfig.primaryKey}' not mapped` }, { status: 400 });
    }

    const updated = await db.update(table).set(data).where(eq(pkColumn, id)).returning();
    return NextResponse.json({ success: true, message: "Record updated", updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update record";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/database
 * Deletes a row from the specified table.
 */
export async function DELETE(request: Request) {
  const auth = await verifyAdminAuth();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const tableName = searchParams.get("table");
  const id = searchParams.get("id");

  if (!tableName || !ALL_TABLES[tableName]) {
    return NextResponse.json({ error: "Invalid or missing table name" }, { status: 400 });
  }

  if (!id) {
    return NextResponse.json({ error: "Record ID is required" }, { status: 400 });
  }

  try {
    const tableConfig = ALL_TABLES[tableName];
    const table = tableConfig.table;
    const pkColumn = (table as any)[tableConfig.primaryKey];

    if (!pkColumn) {
      return NextResponse.json({ error: `Cannot delete: primary key '${tableConfig.primaryKey}' not mapped` }, { status: 400 });
    }

    await db.delete(table).where(eq(pkColumn, id));
    return NextResponse.json({ success: true, message: "Record deleted successfully" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete record";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
