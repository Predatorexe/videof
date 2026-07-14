/**
 * Fixed-window in-memory rate limiter. Sufficient for per-instance
 * abuse protection; swap for KV/Durable Objects when true global limits
 * are required.
 */
import { RateLimitError } from "@/lib/errors";

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitOptions {
  /** Bucket identifier — typically ip+route or shopId+action. */
  key: string;
  /** Maximum requests per window. */
  max: number;
  /** Window duration in milliseconds. */
  windowMs: number;
}

export function rateLimit({ key, max, windowMs }: RateLimitOptions) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  if (bucket.count >= max) {
    throw new RateLimitError(
      `Rate limit exceeded. Try again in ${Math.ceil((bucket.resetAt - now) / 1000)}s.`,
    );
  }
  bucket.count += 1;
}
