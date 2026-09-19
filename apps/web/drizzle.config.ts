import { defineConfig } from "drizzle-kit";

// drizzle-kit runs dotenv at startup: it loads ./.env from the cwd (apps/web) only, never
// .env.local, and never overrides variables already in the environment.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  // Must match drizzle({ casing }) in src/db/client.ts so runtime SQL and DDL agree.
  casing: "snake_case",
  dbCredentials: {
    // Only migrate / push / studio / pull connect; generate / check never do.
    url: process.env.DATABASE_URL ?? "postgres://juicekit:juicekit@localhost:5432/juicekit",
  },
  migrations: { table: "__drizzle_migrations", schema: "drizzle" },
  strict: true,
  verbose: true,
});
