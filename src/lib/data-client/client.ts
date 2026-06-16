"use client";

import { getBrowserSupabase } from "@/src/lib/supabase/browser";

// Auth runs on Supabase; the application data still lives on Amazon RDS and is
// reached through the /api/db-proxy route via DbQueryBuilder below.

class DbQueryBuilder {
  private _table: string;
  private _filters: Array<[string, string, any]> = [];
  private _inFilters: Array<[string, any[]]> = [];
  private _order: Array<[string, string]> = [];
  private _select: string = "*";
  private _single = false;
  private _maybeSingle = false;
  private _limit?: number;

  constructor(table: string) {
    this._table = table;
  }

  select(fields: string) {
    this._select = fields;
    return this;
  }

  eq(column: string, value: any) {
    this._filters.push(["eq", column, value]);
    return this;
  }

  neq(column: string, value: any) {
    this._filters.push(["neq", column, value]);
    return this;
  }

  in(column: string, values: any[]) {
    this._inFilters.push([column, values]);
    return this;
  }

  order(column: string, opts?: { ascending?: boolean }) {
    this._order.push([column, (opts?.ascending ?? true) ? "ASC" : "DESC"]);
    return this;
  }

  limit(n: number) {
    this._limit = n;
    return this;
  }

  single() {
    this._single = true;
    return this._execute();
  }

  maybeSingle() {
    this._maybeSingle = true;
    return this._execute();
  }

  then(resolve: (v: any) => any, reject?: (e: any) => any) {
    return this._execute().then(resolve, reject);
  }

  private async _execute(): Promise<{ data: any; error: any }> {
    try {
      const res = await fetch(`/api/db-proxy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: this._table,
          select: this._select,
          filters: this._filters,
          inFilters: this._inFilters,
          order: this._order,
          limit: this._limit,
          single: this._single || this._maybeSingle,
        }),
      });

      if (!res.ok) {
        return { data: null, error: { message: `DB request failed: ${res.status}` } };
      }

      const json = await res.json();
      return { data: json.data ?? null, error: json.error ?? null };
    } catch (err: any) {
      return { data: null, error: { message: err.message } };
    }
  }

  async insert(rows: any | any[]) {
    return this._mutate("insert", rows);
  }

  async update(values: Record<string, any>) {
    return this._mutate("update", values);
  }

  async delete() {
    return this._mutate("delete", null);
  }

  private async _mutate(op: string, payload: any): Promise<{ data: any; error: any }> {
    try {
      const token = await fetch("/api/auth-token").then((r) => r.json()).then((r) => r.token).catch(() => null);
      const res = await fetch(`/api/db-proxy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          table: this._table,
          op,
          payload,
          filters: this._filters,
          inFilters: this._inFilters,
          select: this._select,
        }),
      });

      if (!res.ok) {
        return { data: null, error: { message: `DB request failed: ${res.status}` } };
      }

      const json = await res.json();
      return { data: json.data ?? null, error: json.error ?? null };
    } catch (err: any) {
      return { data: null, error: { message: err.message } };
    }
  }
}

let cachedClient: any = null;

export function createClient() {
  if (cachedClient) return cachedClient;

  const supabase = getBrowserSupabase();

  cachedClient = {
    // Real Supabase auth — its API (getSession, onAuthStateChange,
    // signInWithPassword, signUp, signInWithOAuth, signOut, updateUser, …) is
    // exactly what the app already calls.
    auth: supabase.auth,
    // Data still comes from RDS via the proxy, not from Supabase.
    from: (table: string) => new DbQueryBuilder(table),
    // Realtime is not wired to RDS; return a no-op channel so callers don't crash.
    channel: (_name: string) => ({
      on: function (this: any) { return this; },
      subscribe: () => ({ unsubscribe: () => {} }),
      unsubscribe: () => Promise.resolve("ok" as const),
    }),
    // Image storage on Amazon S3 (bucket name becomes the S3 key folder).
    storage: {
      from: (bucket: string) => ({
        async upload(path: string, file: Blob | File, _opts?: any) {
          try {
            const form = new FormData();
            form.append("file", file);
            form.append("folder", bucket);
            form.append("path", path);
            const res = await fetch("/api/upload", { method: "POST", body: form });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) return { data: null, error: json.error ?? { message: `Upload failed: ${res.status}` } };
            return { data: { path }, error: null };
          } catch (err: any) {
            return { data: null, error: { message: err.message } };
          }
        },
        getPublicUrl(path: string) {
          const region = process.env.NEXT_PUBLIC_S3_REGION || "ap-south-1";
          const s3Bucket = process.env.NEXT_PUBLIC_S3_BUCKET || "looplic-assets";
          return { data: { publicUrl: `https://${s3Bucket}.s3.${region}.amazonaws.com/${bucket}/${path}` } };
        },
        remove: async (_paths: string[]) => ({ data: null, error: null }),
      }),
    },
  };

  return cachedClient;
}
