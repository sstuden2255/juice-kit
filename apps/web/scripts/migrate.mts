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
  // Drizzle's message is multi-line ("Failed query: ...\nparams: ..."), so printing it whole
  // renders the connection error as if it were a query parameter. Keep the first line only,
  // and add the driver code: an unreachable server surfaces as an AggregateError with an
  // empty message, which would otherwise print a bare "migration failed:".
  const cause = err instanceof Error && err.cause instanceof Error ? ` (${err.cause.message})` : "";
  const code =
    typeof err === "object" && err !== null && "code" in err ? ` [${String(err.code)}]` : "";
  const message =
    err instanceof Error ? `${err.message.split("\n")[0]}${cause}${code}` : String(err);
  console.error("migration failed:", message);
  process.exitCode = 1;
} finally {
  await client.end({ timeout: 5 });
}
