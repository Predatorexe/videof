// Lightweight simulated backend: delay, jittery failure, retry, CSV/PDF downloads.

let __idc = 0;
export function newId(prefix = "id") {
  __idc += 1;
  const rnd = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}${__idc.toString(36)}${rnd}`;
}

export function delay(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException("Aborted", "AbortError"));
    const t = setTimeout(() => resolve(), ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(t);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

export type ApiOptions<T> = {
  data?: T;
  minDelay?: number;
  maxDelay?: number;
  failureRate?: number; // 0..1
  signal?: AbortSignal;
};

/** Simulate a network call. Resolves after a random delay, occasionally throws. */
export async function apiCall<T>({
  data,
  minDelay = 200,
  maxDelay = 600,
  failureRate = 0,
  signal,
}: ApiOptions<T> = {}): Promise<T> {
  const wait = minDelay + Math.random() * Math.max(0, maxDelay - minDelay);
  await delay(wait, signal);
  if (failureRate > 0 && Math.random() < failureRate) {
    throw new Error("Network request failed. Please retry.");
  }
  return data as T;
}

/** Retry an async op with exponential backoff. */
export async function withRetry<T>(
  fn: () => Promise<T>,
  { retries = 2, baseDelay = 300 }: { retries?: number; baseDelay?: number } = {},
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === retries) break;
      await delay(baseDelay * Math.pow(2, attempt));
    }
  }
  throw lastErr;
}

export function downloadBlob(filename: string, blob: Blob) {
  if (typeof document === "undefined") return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadText(filename: string, text: string, mime = "text/plain;charset=utf-8") {
  downloadBlob(filename, new Blob([text], { type: mime }));
}
