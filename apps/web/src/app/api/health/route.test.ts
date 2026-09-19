// @vitest-environment node
import { beforeEach, expect, test, vi } from "vitest";

const { executeMock, pingMock } = vi.hoisted(() => ({
  executeMock: vi.fn(),
  pingMock: vi.fn(),
}));

vi.mock("@/db/client", () => ({ getDb: () => ({ execute: executeMock }) }));
vi.mock("@/lib/redis", () => ({ getRedis: () => ({ ping: pingMock }) }));

import { GET } from "./route";

type HealthBody = {
  status: "ok" | "degraded";
  checks: Record<"postgres" | "redis", { ok: boolean; latencyMs?: number; error?: string }>;
};

beforeEach(() => {
  executeMock.mockReset();
  pingMock.mockReset();
});

test("returns 200 when postgres and redis respond", async () => {
  executeMock.mockResolvedValue([{ "?column?": 1 }]);
  pingMock.mockResolvedValue("PONG");

  const res = await GET();
  const body = (await res.json()) as HealthBody;

  expect(res.status).toBe(200);
  expect(res.headers.get("cache-control")).toBe("no-store");
  expect(body.status).toBe("ok");
  expect(body.checks.postgres.ok).toBe(true);
  expect(body.checks.redis.ok).toBe(true);
});

test("returns 503 and surfaces the cause when a dependency fails", async () => {
  executeMock.mockRejectedValue(
    new Error("Failed query: select 1\nparams: ", { cause: new Error("connect ECONNREFUSED") }),
  );
  pingMock.mockResolvedValue("PONG");

  const res = await GET();
  const body = (await res.json()) as HealthBody;

  expect(res.status).toBe(503);
  expect(body.status).toBe("degraded");
  expect(body.checks.postgres).toEqual({
    ok: false,
    error: "Failed query: select 1 (connect ECONNREFUSED)",
  });
  expect(body.checks.redis.ok).toBe(true);
});
