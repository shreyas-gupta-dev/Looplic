import { getServerSession } from "@/src/lib/auth/cognito-server";
import { db } from "@/src/lib/db";
import { eq, inArray } from "drizzle-orm";
import * as schema from "@/src/lib/db/schema";

export async function createClient() {
  const session = await getServerSession();

  return {
    auth: {
      async getSession() {
        return {
          data: {
            session: session.user
              ? {
                  user: {
                    id: session.user.id,
                    email: session.user.email,
                    user_metadata: { full_name: session.user.name },
                  },
                }
              : null,
          },
        };
      },

      async getUser() {
        return {
          data: {
            user: session.user
              ? {
                  id: session.user.id,
                  email: session.user.email,
                  user_metadata: { full_name: session.user.name },
                }
              : null,
          },
        };
      },

      async exchangeCodeForSession(_code: string) {
        return { data: { session: null }, error: null };
      },
    },

    from(table: string) {
      return new ServerQueryBuilder(table, session.user?.id ?? null);
    },
  };
}

class ServerQueryBuilder {
  private _table: string;
  private _userId: string | null;
  private _filters: Array<[string, string, any]> = [];
  private _inFilters: Array<[string, any[]]> = [];
  private _order: Array<string> = [];
  private _select: string = "*";

  constructor(table: string, userId: string | null) {
    this._table = table;
    this._userId = userId;
  }

  select(fields: string) {
    this._select = fields;
    return this;
  }

  eq(column: string, value: any) {
    this._filters.push(["eq", column, value]);
    return this;
  }

  in(column: string, values: any[]) {
    this._inFilters.push([column, values]);
    return this;
  }

  order(_column: string) {
    return this;
  }

  async maybeSingle() {
    const result = await this._runQuery();
    return { data: Array.isArray(result.data) ? result.data[0] ?? null : result.data, error: result.error };
  }

  async single() {
    const result = await this._runQuery();
    return { data: Array.isArray(result.data) ? result.data[0] ?? null : result.data, error: result.error };
  }

  then(resolve: (v: any) => any, reject?: (e: any) => any) {
    return this._runQuery().then(resolve, reject);
  }

  private async _runQuery(): Promise<{ data: any; error: any }> {
    try {
      const tableMap: Record<string, any> = {
        user_roles: schema.userRoles,
        bookings: schema.bookings,
        brands: schema.brands,
        series: schema.series,
        models: schema.models,
        repair_categories: schema.repairCategories,
        repair_subcategories: schema.repairSubcategories,
        model_repair_services: schema.modelRepairServices,
        model_screen_guards: schema.modelScreenGuards,
        screen_guard_types: schema.screenGuardTypes,
        app_settings: schema.appSettings,
        customer_profiles: schema.customerProfiles,
        model_repair_subcategory_prices: schema.modelRepairSubcategoryPrices,
        service_bills: schema.serviceBills,
        booking_inspections: schema.bookingInspections,
        technician_applications: schema.technicianApplications,
      };

      const tbl = tableMap[this._table];
      if (!tbl) return { data: null, error: { message: `Unknown table: ${this._table}` } };

      let query = db.select().from(tbl) as any;

      for (const [, col, val] of this._filters) {
        const colDef = (tbl as any)[this._toCamel(col)];
        if (colDef) query = query.where(eq(colDef, val));
      }

      for (const [col, vals] of this._inFilters) {
        const colDef = (tbl as any)[this._toCamel(col)];
        if (colDef && vals.length > 0) query = query.where(inArray(colDef, vals));
      }

      const data = await query;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message } };
    }
  }

  private _toCamel(snake: string) {
    return snake.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }
}
