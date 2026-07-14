/**
 * Monitoring facade.
 *
 * Provides a single API — `monitoring.captureException`, `captureMessage`,
 * `addBreadcrumb`, `setUser`, `setTag` — so application code never imports
 * a vendor SDK directly. Ships with two transports:
 *
 *   • `lovable`  — always on, forwards to the Lovable in-editor error stream
 *                  via `window.__lovableEvents` (works in preview + prod).
 *   • `sentry`   — activated automatically when `VITE_SENTRY_DSN` (browser)
 *                  or `SENTRY_DSN` (server) is present. Sentry itself is a
 *                  lazy dynamic import; nothing loads when no DSN is set.
 *
 * Zero-config: safe to call from any code path, SSR or browser.
 */

type Severity = "fatal" | "error" | "warning" | "info" | "debug";

interface Breadcrumb {
  category?: string;
  message?: string;
  level?: Severity;
  data?: Record<string, unknown>;
}

interface CaptureContext {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  user?: { id?: string; email?: string; shopId?: string };
  level?: Severity;
}

type LovableEventsExt = {
  captureMessage?: (message: string, context?: Record<string, unknown>) => void;
};

function lovableEvents(): (Window["__lovableEvents"] & LovableEventsExt) | undefined {
  if (typeof window === "undefined") return undefined;
  return window.__lovableEvents as (Window["__lovableEvents"] & LovableEventsExt) | undefined;
}

/** Lazily initialised Sentry client (null when disabled). */
let sentry: {
  captureException: (e: unknown, ctx?: unknown) => void;
  captureMessage: (m: string, ctx?: unknown) => void;
  addBreadcrumb: (b: Breadcrumb) => void;
  setUser: (u: unknown) => void;
  setTag: (k: string, v: string) => void;
} | null = null;

let initPromise: Promise<void> | null = null;

function getDsn(): string | undefined {
  if (typeof window !== "undefined") {
    // Vite inlines VITE_* at build time.
    return (import.meta as { env?: Record<string, string | undefined> }).env
      ?.VITE_SENTRY_DSN;
  }
  return process.env.SENTRY_DSN ?? process.env.VITE_SENTRY_DSN;
}

/**
 * Idempotent Sentry initialiser. Called automatically on first use.
 * Fails silently if the `@sentry/*` package isn't installed — the
 * Lovable transport keeps working.
 */
export async function initMonitoring(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const dsn = getDsn();
    if (!dsn) return;
    try {
      const isBrowser = typeof window !== "undefined";
      const modName = isBrowser ? "@sentry/browser" : "@sentry/node";
      // Vite ignore prevents bundling — the package is optional.
      const mod = (await import(/* @vite-ignore */ modName).catch(() => null)) as
        | (typeof sentry & { init: (o: unknown) => void })
        | null;
      if (!mod) return;
      mod.init({
        dsn,
        environment: isBrowser
          ? (import.meta as { env?: Record<string, string | undefined> }).env
              ?.VITE_APP_ENV ?? "production"
          : process.env.APP_ENV ?? "production",
        release:
          (isBrowser
            ? (import.meta as { env?: Record<string, string | undefined> }).env
                ?.VITE_APP_VERSION
            : process.env.APP_VERSION) ?? undefined,
        tracesSampleRate: 0.1,
        // Don't ship PII by default.
        sendDefaultPii: false,
      });
      sentry = mod;
    } catch {
      /* optional dependency, ignore */
    }
  })();
  return initPromise;
}

type Mechanism = "manual" | "onerror" | "unhandledrejection" | "react_error_boundary";

function toLovable(error: unknown, ctx: CaptureContext | undefined, mechanism: Mechanism) {
  const ev = lovableEvents();
  if (!ev) return;
  ev.captureException?.(
    error,
    {
      route: typeof location !== "undefined" ? location.pathname : undefined,
      ...ctx?.extra,
      ...ctx?.tags,
    },
    {
      mechanism,
      handled: mechanism !== "onerror" && mechanism !== "unhandledrejection",
      severity: ctx?.level === "warning" || ctx?.level === "info" ? ctx.level : "error",
    },
  );
}

export const monitoring = {
  init: initMonitoring,

  captureException(error: unknown, ctx?: CaptureContext) {
    void initMonitoring();
    toLovable(error, ctx, "manual");
    if (sentry) {
      sentry.captureException(error, ctx);
    } else {
      // eslint-disable-next-line no-console
      console.error("[monitoring]", error, ctx ?? {});
    }
  },

  captureMessage(message: string, ctx?: CaptureContext) {
    void initMonitoring();
    if (typeof window !== "undefined") {
      window.__lovableEvents?.captureMessage?.(message, {
        ...ctx?.extra,
        ...ctx?.tags,
      });
    }
    if (sentry) sentry.captureMessage(message, ctx);
    else console.info("[monitoring]", message, ctx ?? {});
  },

  addBreadcrumb(b: Breadcrumb) {
    if (sentry) sentry.addBreadcrumb(b);
  },

  setUser(user: { id?: string; email?: string; shopId?: string } | null) {
    if (sentry) sentry.setUser(user);
  },

  setTag(key: string, value: string) {
    if (sentry) sentry.setTag(key, value);
  },
};

/**
 * Attach global error handlers. Safe to call multiple times — installs
 * once per environment. Should be invoked from the root shell on the
 * client and from the server entry.
 */
let handlersInstalled = false;
export function installGlobalErrorHandlers() {
  if (handlersInstalled) return;
  handlersInstalled = true;
  void initMonitoring();
  if (typeof window !== "undefined") {
    window.addEventListener("error", (event) => {
      monitoring.captureException(event.error ?? event.message, {
        level: "error",
        tags: { source: "window.onerror" },
      });
    });
    window.addEventListener("unhandledrejection", (event) => {
      monitoring.captureException(event.reason, {
        level: "error",
        tags: { source: "unhandledrejection" },
      });
    });
  }
}
