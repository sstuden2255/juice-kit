// Same behaviour and tracking table (drizzle.__drizzle_migrations) as `drizzle-kit migrate`,
// which exits 1 with no error text when the database is unreachable. This prints the real
// error. Node 24 strips types natively; the .mts extension forces ESM.
//   node --env-file-if-exists=.env scripts/migrate.mts
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const client = postgres(url, { max: 1, connect_timeout: 10, onnotice: () => {} });
try {
  await migrate(drizzle({ client }), { migrationsFolder: "./drizzle" });
  console.log("migrations applied");
} catch (err) {
  const cause = err instanceof Error && err.cause instanceof Error ? ` (${err.cause.message})` : "";
  console.error("migration failed:", err instanceof Error ? err.message + cause : err);
  process.exitCode = 1;
} finally {
  await client.end({ timeout: 5 });
}
