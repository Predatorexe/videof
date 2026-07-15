/**
 * Retry with exponential backoff + jitter.
 * Used for transient Shopify / storage-provider failures.
 */
export interface RetryOptions {
  retries?: number;
  baseMs?: number;
  maxMs?: number;
  /** Return true to retry. Defaults to retrying on Error. */
  shouldRetry?: (err: unknown, attempt: number) => boolean;
  onRetry?: (err: unknown, attempt: number, delayMs: number) => void;
}

const DEFAULT_SHOULD_RETRY = (err: unknown) => {
  if (!(err instanceof Error)) return true;
  const msg = err.message.toLowerCase();
  // Do not retry client-side validation or auth failures.
  if (/\b(401|403|400|422|invalid|forbidden|unauthorized)\b/.test(msg)) return false;
  return true;
};

export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const retries = opts.retries ?? 3;
  const base = opts.baseMs ?? 400;
  const max = opts.maxMs ?? 8_000;
  const shouldRetry = opts.shouldRetry ?? DEFAULT_SHOULD_RETRY;
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt += 1;
      if (attempt > retries || !shouldRetry(err, attempt)) throw err;
      const jitter = Math.random() * base;
      const delay = Math.min(max, base * 2 ** (attempt - 1) + jitter);
      opts.onRetry?.(err, attempt, delay);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}
