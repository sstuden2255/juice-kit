import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { getRedis } from "@/lib/redis";

const TIMEOUT_MS = 2_000;

type CheckResult = { ok: true; latencyMs: number } | { ok: false; error: string };

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

/** Drizzle wraps driver failures as "Failed query: ..." with the real error in `cause`. */
function describeError(err: unknown): string {
  if (err instanceof Error) {
    const cause = err.cause instanceof Error ? ` (${err.cause.message})` : "";
    return `${err.message.split("\n")[0]}${cause}`;
  }
  return String(err);
}

async function runCheck(label: string, fn: () => Promise<unknown>): Promise<CheckResult> {
  const start = performance.now();
  try {
    // fn() is called inside the try so a synchronous throw (missing env var) is reported too.
    await withTimeout(fn(), TIMEOUT_MS, label);
    return { ok: true, latencyMs: Math.round(performance.now() - start) };
  } catch (err) {
    return { ok: false, error: describeError(err) };
  }
}

// GET route handlers are dynamic by default in Next 15+; no segment config needed.
export async function GET(): Promise<Response> {
  const [postgres, redis] = await Promise.all([
    runCheck("postgres", () => getDb().execute(sql`select 1`)),
    runCheck("redis", () => getRedis().ping()),
  ]);
  const ok = postgres.ok && redis.ok;
  return Response.json(
    { status: ok ? "ok" : "degraded", checks: { postgres, redis } },
    { status: ok ? 200 : 503, headers: { "cache-control": "no-store" } },
  );
}
