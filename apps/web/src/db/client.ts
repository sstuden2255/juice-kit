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

  // postgres() opens no socket until the first query.
  const client = postgres(url, {
    max: Number(process.env.DATABASE_POOL_MAX ?? 10),
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
