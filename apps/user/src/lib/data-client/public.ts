import { db } from "@/src/lib/db";
import { and, asc, eq, inArray, ne } from "drizzle-orm";
import * as schema from "@/src/lib/db/schema";

function camelToSnake(col: string) {
  return col.replace(/([A-Z])/g, "_$1").toLowerCase();
}

function snakeToCamel(col: string) {
  return col.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
}

// This client has NO auth/session check of any kind — every table listed
// here is readable by anyone who can reach the calling server code, with
// whatever filters that code passes. Only list genuinely public catalog
// data; never add bookings/customer_profiles/service_bills or any other
// per-user table here (use the session-checked, ownership-scoped db-proxy
// client in data-client/client.ts for those instead).
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
  blog_posts: schema.blogPosts,
  products: schema.products,
  product_images: schema.productImages,
};

class PublicQueryBuilder {
  private _table: string;
  private _filters: Array<[string, any]> = [];
  private _inFilters: Array<[string, any[]]> = [];
  private _neqFilters: Array<[string, any]> = [];
  private _orderCols: string[] = [];
  private _limitN?: number;
  private _selectFields: string = "*";
  private _isSingle = false;
  private _isMaybeSingle = false;

  constructor(table: string) {
    this._table = table;
  }

  select(fields: string) {
    this._selectFields = fields;
    return this;
  }

  eq(column: string, value: any) {
    this._filters.push([column, value]);
    return this;
  }

  neq(column: string, value: any) {
    this._neqFilters.push([column, value]);
    return this;
  }

  in(column: string, values: any[]) {
    this._inFilters.push([column, values]);
    return this;
  }

  order(column: string, _opts?: any) {
    this._orderCols.push(column);
    return this;
  }

  limit(n: number) {
    this._limitN = n;
    return this;
  }

  single() {
    this._isSingle = true;
    return this._run();
  }

  maybeSingle() {
    this._isMaybeSingle = true;
    return this._run();
  }

  then(resolve: (v: any) => any, reject?: (e: any) => any) {
    return this._run().then(resolve, reject);
  }

  private async _run(): Promise<{ data: any; error: any }> {
    try {
      const tbl = TABLE_MAP[this._table];
      if (!tbl) return { data: null, error: { message: `Unknown table: ${this._table}` } };

      let query = db.select().from(tbl) as any;

      const conditions: any[] = [];

      for (const [col, val] of this._filters) {
        const colDef = tbl[snakeToCamel(col)];
        if (colDef !== undefined) conditions.push(eq(colDef, val));
      }

      for (const [col, val] of this._neqFilters) {
        const colDef = tbl[snakeToCamel(col)];
        if (colDef !== undefined) conditions.push(ne(colDef, val));
      }

      for (const [col, vals] of this._inFilters) {
        const colDef = tbl[snakeToCamel(col)];
        if (colDef !== undefined && vals.length > 0) conditions.push(inArray(colDef, vals));
      }

      if (conditions.length === 1) {
        query = query.where(conditions[0]);
      } else if (conditions.length > 1) {
        query = query.where(and(...conditions));
      }

      if (this._orderCols.length > 0) {
        const orderExprs = this._orderCols
          .map((col) => tbl[snakeToCamel(col)])
          .filter(Boolean)
          .map((colDef: any) => asc(colDef));
        if (orderExprs.length > 0) query = query.orderBy(...orderExprs);
      }

      if (this._limitN) query = query.limit(this._limitN);

      const rows: any[] = await query;

      const mapRow = (row: any) => {
        const mapped: any = {};
        for (const [k, v] of Object.entries(row)) {
          mapped[camelToSnake(k)] = v;
        }
        return mapped;
      };

      const mapped = rows.map(mapRow);

      if (this._isSingle || this._isMaybeSingle) {
        return { data: mapped[0] ?? null, error: null };
      }

      return { data: mapped, error: null };
    } catch (err: any) {
      const isSingle = this._isSingle || this._isMaybeSingle;
      return { data: isSingle ? null : [], error: { message: err.message } };
    }
  }
}

export function createPublicClient() {
  return {
    from: (table: string) => new PublicQueryBuilder(table),
  };
}
