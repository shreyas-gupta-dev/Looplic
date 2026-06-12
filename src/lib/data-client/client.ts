"use client";

import { Amplify } from "aws-amplify";
import {
  fetchAuthSession,
  signIn,
  signInWithRedirect,
  signOut,
  signUp,
  type AuthUser,
} from "aws-amplify/auth";
import { amplifyConfig, hasCognitoConfig } from "@/src/lib/auth/config";

let amplifyConfigured = false;

function ensureAmplify() {
  if (!amplifyConfigured && hasCognitoConfig) {
    Amplify.configure(amplifyConfig, { ssr: true });
    amplifyConfigured = true;
  }
}

type Listener = (event: string, session: any) => void;
const listeners: Listener[] = [];
let currentSession: any = null;

async function resolveSession() {
  ensureAmplify();
  try {
    const { tokens } = await fetchAuthSession();
    if (!tokens?.idToken) return null;
    const payload = tokens.idToken.payload;
    return {
      user: {
        id: String(payload.sub || ""),
        email: String(payload.email || ""),
        user_metadata: { full_name: String(payload.name || "") },
      },
    };
  } catch {
    return null;
  }
}

function createAuthObject() {
  return {
    async getSession() {
      const session = await resolveSession();
      return { data: { session } };
    },

    async getUser() {
      const session = await resolveSession();
      return { data: { user: session?.user ?? null } };
    },

    onAuthStateChange(callback: Listener) {
      listeners.push(callback);
      resolveSession().then((session) => {
        currentSession = session;
        callback("INITIAL_SESSION", session);
      });
      const subscription = {
        unsubscribe() {
          const idx = listeners.indexOf(callback);
          if (idx >= 0) listeners.splice(idx, 1);
        },
      };
      return { data: { subscription } };
    },

    async signInWithPassword({ email, password }: { email: string; password: string }) {
      ensureAmplify();
      try {
        const result = await signIn({ username: email.trim().toLowerCase(), password: password.trim() });
        if (result.isSignedIn) {
          const session = await resolveSession();
          currentSession = session;
          listeners.forEach((fn) => fn("SIGNED_IN", session));
          return { data: { session }, error: null };
        }
        return { data: { session: null }, error: { message: "Sign in incomplete" } };
      } catch (err: any) {
        return { data: { session: null }, error: { message: err.message || "Sign in failed" } };
      }
    },

    async signUp({ email, password, options }: { email: string; password: string; options?: any }) {
      ensureAmplify();
      try {
        const name = options?.data?.full_name || "";
        const result = await signUp({
          username: email.trim().toLowerCase(),
          password,
          options: {
            userAttributes: { email: email.trim().toLowerCase(), name },
          },
        });
        if (result.isSignUpComplete) {
          const session = await resolveSession();
          return { data: { user: session?.user ?? null, session }, error: null };
        }
        return { data: { user: null, session: null }, error: null };
      } catch (err: any) {
        return { data: { user: null, session: null }, error: { message: err.message || "Sign up failed" } };
      }
    },

    async signInWithOAuth({ provider, options }: { provider: string; options?: any }) {
      ensureAmplify();
      try {
        const redirectTo = options?.redirectTo;
        const customState = redirectTo ? JSON.stringify({ redirectTo }) : undefined;
        await signInWithRedirect({ provider: "Google" as any, customState });
        return { error: null };
      } catch (err: any) {
        return { error: { message: err.message || "OAuth failed" } };
      }
    },

    async signOut() {
      ensureAmplify();
      await signOut();
      currentSession = null;
      listeners.forEach((fn) => fn("SIGNED_OUT", null));
    },

    async exchangeCodeForSession(_code: string) {
      const session = await resolveSession();
      currentSession = session;
      listeners.forEach((fn) => fn("SIGNED_IN", session));
      return { data: { session }, error: null };
    },
  };
}

function createDbProxy() {
  return {
    from(table: string) {
      return new DbQueryBuilder(table);
    },
  };
}

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

  cachedClient = {
    auth: createAuthObject(),
    from: (table: string) => new DbQueryBuilder(table),
    storage: {
      from: (_bucket: string) => ({
        upload: async (_path: string, _file: any) => ({ data: null, error: { message: "Use S3 upload instead" } }),
        getPublicUrl: (_path: string) => ({ data: { publicUrl: "" } }),
        remove: async (_paths: string[]) => ({ data: null, error: null }),
      }),
    },
  };

  return cachedClient;
}
