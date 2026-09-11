import "server-only";

/**
 * Minimal in-memory, fixed-window rate limiter for a single Node.js process
 * (e.g. sensitive Server Actions like login/register). It resets on
 * deploys/restarts and is per-instance, not distributed — good enough for
 * this project's scale; swap for a durable store (Redis/Upstash) if you
 * scale to multiple instances.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}
