/**
 * Liveness + readiness probe.
 *
 * GET  /api/public/health        → { status, uptimeMs, version, checks }
 * HEAD /api/public/health        → 200 empty (cheap liveness for load balancers)
 *
 * Public by design: no PII, no secrets, safe for uptime monitors
 * (BetterUptime, Pingdom, UptimeRobot, Cloudflare Health Checks).
 */
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const BOOT_TS = Date.now();

type CheckStatus = "ok" | "degraded" | "down" | "skipped";
interface Check {
  name: string;
  status: CheckStatus;
  latencyMs?: number;
  error?: string;
}

async function checkDatabase(): Promise<Check> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    return { name: "database", status: "skipped", error: "env not configured" };
  }
  const started = Date.now();
  try {
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
            h.delete("Authorization");
          }
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });
    // Lightweight round-trip. `head+count` avoids returning rows.
    const { error } = await supabase
      .from("shops")
      .select("id", { head: true, count: "exact" })
      .limit(1);
    if (error) throw error;
    return { name: "database", status: "ok", latencyMs: Date.now() - started };
  } catch (err) {
    return {
      name: "database",
      status: "down",
      latencyMs: Date.now() - started,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export const Route = createFileRoute("/api/public/health")({
  server: {
    handlers: {
      HEAD: async () => new Response(null, { status: 200 }),
      GET: async () => {
        const checks = await Promise.all([checkDatabase()]);
        const worst = checks.reduce<CheckStatus>((acc, c) => {
          if (c.status === "down") return "down";
          if (c.status === "degraded" && acc !== "down") return "degraded";
          return acc;
        }, "ok");
        const httpStatus = worst === "down" ? 503 : 200;
        return Response.json(
          {
            status: worst,
            uptimeMs: Date.now() - BOOT_TS,
            timestamp: new Date().toISOString(),
            version: process.env.APP_VERSION ?? "dev",
            environment: process.env.APP_ENV ?? "production",
            checks,
          },
          {
            status: httpStatus,
            headers: {
              "cache-control": "no-store, max-age=0",
              "content-type": "application/json",
            },
          },
        );
      },
    },
  },
});
