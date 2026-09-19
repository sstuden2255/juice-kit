import { Redis } from "ioredis";

const globalForRedis = globalThis as unknown as { __juicekitRedis?: Redis };

/** Lazy singleton: connects on the first command, never at import or build time. */
export function getRedis(): Redis {
  if (globalForRedis.__juicekitRedis) return globalForRedis.__juicekitRedis;

  const url = process.env.REDIS_URL;
  if (!url) throw new Error("REDIS_URL is not set");

  const redis = new Redis(url, {
    lazyConnect: true,
    // Fail queued commands after a couple of reconnect attempts instead of the default 20.
    maxRetriesPerRequest: 2,
    connectTimeout: 5_000,
    commandTimeout: 2_000,
    // ioredis 6 speaks RESP3 (HELLO 3) and downgrades automatically on Redis < 6. Reply
    // shapes stay RESP2-identical under the default replyMapping "legacy".
  });

  // ioredis swallows "error" events when nobody listens; log them so outages are visible.
  redis.on("error", (err: Error) => {
    console.error("[redis]", err.message);
  });

  globalForRedis.__juicekitRedis = redis;
  return redis;
}
