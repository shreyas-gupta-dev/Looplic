import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

let pool: Pool | null = null;

function getPool(): Pool {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;

  if (connectionString) {
    pool = new Pool({
      connectionString,
      ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
      max: 10,
      // Keep pooled connections alive between requests so warm Lambdas (kept hot
      // by the EventBridge warmer) reuse an open RDS connection instead of paying
      // a fresh TLS reconnect (~300-800ms) on each request after a short idle.
      idleTimeoutMillis: 300000,
      keepAlive: true,
    });
  } else {
    pool = new Pool({
      host: process.env.RDS_HOST || "localhost",
      port: Number(process.env.RDS_PORT) || 5432,
      database: process.env.RDS_DATABASE || "looplic",
      user: process.env.RDS_USER || "postgres",
      password: process.env.RDS_PASSWORD || "",
      ssl: process.env.RDS_SSL === "false" ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 300000,
      keepAlive: true,
    });
  }

  return pool;
}

export function getDb() {
  return drizzle(getPool(), { schema });
}

export const db = new Proxy({} as ReturnType<typeof getDb>, {
  get(_target, prop) {
    return (getDb() as any)[prop];
  },
});

export * from "./schema";
