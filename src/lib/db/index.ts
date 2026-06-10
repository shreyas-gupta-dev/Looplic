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
      idleTimeoutMillis: 30000,
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
      idleTimeoutMillis: 30000,
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
