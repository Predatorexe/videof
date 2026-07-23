/**
 * Production rate limiter backed by Supabase (`public.rate_limits` +
 * `rate_limit_check` RPC).
 *
 * - Atomic UPSERT + INCREMENT inside a single SECURITY DEFINER function
 *   so concurrent Workers can't race the counter.
 * - Sliding window: each key rolls independently — the window resets the
 *   next time the key is hit after its own `expires_at`.
 * - Automatic expiry: `rate_limit_check` sweeps stale rows opportunistically,
 *   and a pg_cron job cleans the tail every 10 minutes.
 * - `bypassOnError: true` (default) fails-open on infra hiccups so a
 *   database outage never takes the storefront offline. Auth-critical
 *   callers can pass `bypassOnError: false` to fail-closed.
 */
import { RateLimitError } from "@/lib/errors";
import { logger } from "@/lib/logger";

export interface RateLimitOptions {
  /** Bucket identifier — typically ip+route or shopId+action. */
  key: string;
  /** Maximum requests allowed per window. */
  max: number;
  /** Window duration in milliseconds. */
  windowMs: number;
  /**
   * When true (default) and the rate-limit backend errors, allow the
   * request through. Set false for authentication-critical callers.
   */
  bypassOnError?: boolean;
}

export async function rateLimit({
  key,
  max,
  windowMs,
  bypassOnError = true,
}: RateLimitOptions): Promise<void> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("rate_limit_check", {
      _key: key,
      _max: max,
      _window_ms: windowMs,
    });
    if (error) throw new Error(error.message);
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return;
    if (row.allowed === false) {
      const resetAt = row.reset_at ? new Date(row.reset_at as string).getTime() : Date.now() + windowMs;
      const retryIn = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
      throw new RateLimitError(`Rate limit exceeded. Try again in ${retryIn}s.`);
    }
  } catch (err) {
    if (err instanceof RateLimitError) throw err;
    logger.warn("rate_limit.backend_error", {
      key,
      message: err instanceof Error ? err.message : String(err),
    });
    if (!bypassOnError) {
      throw new RateLimitError("Rate limit backend unavailable.");
    }
  }
}
