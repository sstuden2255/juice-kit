import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Db = PostgresJsDatabase<typeof schema> & { $client: postgres.Sql };

// Survives `next dev` HMR: modules re-evaluate, globalThis does not.
const globalForDb = globalThis as unknown as { __juicekitDb?: Db };

/** Lazy singleton: nothing connects at import time, so `next build` never touches Postgres. */
export function getDb(): Db {
  if (globalForDb.__juicekitDb) return globalForDb.__juicekitDb;

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  // postgres.js allocates an array of `max` connections: a non-numeric value throws
  // "RangeError: Invalid array length" from deep inside the driver, and 0 makes every query
  // wait forever. Fail loudly at the env var instead.
  const max = Number.parseInt(process.env.DATABASE_POOL_MAX ?? "10", 10);
  if (!Number.isInteger(max) || max < 1) {
    throw new Error("DATABASE_POOL_MAX must be a positive integer");
  }

  // postgres() opens no socket until the first query.
  const client = postgres(url, {
    max,
    idle_timeout: 20,
    connect_timeout: 10,
    // Prepared statements stay on for a direct connection. Set DATABASE_PREPARE=false only
    // behind a transaction-mode pooler (PgBouncer transaction mode, Supabase pooler).
    prepare: process.env.DATABASE_PREPARE !== "false",
    onnotice: () => {},
  });

  const db = drizzle({ client, schema, casing: "snake_case" });
  globalForDb.__juicekitDb = db;
  return db;
}
