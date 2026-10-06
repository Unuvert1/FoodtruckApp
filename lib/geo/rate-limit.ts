// Per-truck limiter for address lookups: 30 per minute, 400 per day.
//
// Honest caveat: this lives in module memory, and each serverless instance has
// its own, so it is a speed bump, not a wall. It is adequate while the only
// callers are signed-in vendors. The upgrade path is a table or Upstash Redis
// behind the same `take()` signature.

type Limits = { perMinute: number; perDay: number };
export type RateLimitResult = { ok: true } | { ok: false; retryAfterSeconds: number };

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

export function createRateLimiter({ perMinute, perDay }: Limits, now: () => number = Date.now) {
  const hits = new Map<string, number[]>();

  return {
    take(key: string): RateLimitResult {
      const t = now();
      const recent = (hits.get(key) ?? []).filter((at) => t - at < DAY);
      const lastMinute = recent.filter((at) => t - at < MINUTE);

      if (lastMinute.length >= perMinute) {
        return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((lastMinute[0] + MINUTE - t) / 1000)) };
      }
      if (recent.length >= perDay) {
        return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((recent[0] + DAY - t) / 1000)) };
      }

      recent.push(t);
      hits.set(key, recent);
      // Keep the map from growing forever: drop trucks that have gone quiet.
      if (hits.size > 500) for (const [k, v] of hits) if (v.every((at) => t - at >= DAY)) hits.delete(k);
      return { ok: true };
    },
  };
}

export const geoRateLimiter = createRateLimiter({ perMinute: 30, perDay: 400 });
