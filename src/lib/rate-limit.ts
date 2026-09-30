import "server-only";
import { redis } from "@/lib/redis";

/**
 * Fixed-window counter. Returns ok=false once `limit` hits within `windowSec`.
 * Verifyme also rate-limits; this stops abuse before it costs you a request.
 */
export async function rateLimit(key: string, limit: number, windowSec: number) {
  const k = `rl:${key}`;
  const count = await redis.incr(k);
  if (count === 1) await redis.expire(k, windowSec);
  if (count <= limit) return { ok: true as const };
  const ttl = await redis.ttl(k);
  return { ok: false as const, retryAfter: ttl > 0 ? ttl : windowSec };
}

export function clientIp(headers: Headers) {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
