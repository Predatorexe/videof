# Logging, Monitoring & Alerting

## Logging

Server code uses `src/lib/logger.ts` — a structured JSON logger. Every
log line is a single JSON object indexed by the Worker log aggregator.

```ts
import { logger } from "@/lib/logger";

logger.info("widget.publish", { shopId, widgetId });
logger.error("shopify.admin.graphql_failed", { shopId, status, error: err.message });
```

**Rules:**
- Never log secrets, tokens, session cookies, or full customer PII.
- Use `logger.child({ shopId, requestId })` at the top of a handler to
  bind context once.
- Prefer stable event names (`widget.publish`, `webhook.received`) over
  free-form messages — they become dashboard filters.

**Log levels:**
| Level   | Use for                                            |
| ------- | -------------------------------------------------- |
| `debug` | Local development only; suppressed in production   |
| `info`  | Normal lifecycle events (publish, webhook OK, ...) |
| `warn`  | Recoverable degradation (rate-limit hit, retry)    |
| `error` | Unhandled failure, dropped work, security event    |

## Monitoring

Application code calls the vendor-agnostic facade in
`src/lib/monitoring.ts`:

```ts
import { monitoring } from "@/lib/monitoring";

monitoring.captureException(err, {
  tags: { area: "webhook", topic: "orders/create" },
  extra: { shopId },
});
```

Two transports run in parallel:

1. **Lovable in-editor stream** — always active, no configuration.
   Powers the "Runtime errors" panel and chat surfacing.
2. **Sentry** — activated automatically when `SENTRY_DSN` (server) or
   `VITE_SENTRY_DSN` (browser) is set. The Sentry SDK is a lazy
   dynamic import; no bundle cost when disabled.

Bootstrap once on the client (e.g. in `src/routes/__root.tsx`'s
`RootComponent` `useEffect`):

```ts
import { installGlobalErrorHandlers } from "@/lib/monitoring";
useEffect(() => { installGlobalErrorHandlers(); }, []);
```

The root `errorComponent` already forwards React errors via
`reportLovableError`.

## Health checks

- `GET  /api/public/health` — full readiness probe with per-check status.
- `HEAD /api/public/health` — cheap liveness for load balancers.

Point external monitors (BetterUptime, Pingdom, Cloudflare Health Checks)
at the `GET` endpoint at 60-second intervals. Response is `200` when
healthy, `503` when any dependency is `down`.

## Alerting

Recommended pager rules once Sentry / uptime monitor is wired up:

| Rule                                              | Severity | Action           |
| ------------------------------------------------- | -------- | ---------------- |
| `/api/public/health` returns non-2xx for ≥ 2 min  | page     | on-call engineer |
| Sentry error rate > 10 events/min for ≥ 5 min     | page     | on-call engineer |
| Sentry new-issue in `webhook.*`                   | ticket   | next business day|
| Rate-limit rejections > 1000/min sustained        | ticket   | investigate abuse|

## Dashboards

Minimum useful dashboards (build in Sentry / Grafana / DataDog once a
provider is chosen):

- Requests per route, p50 / p95 latency.
- Error rate by route.
- Webhook throughput and failure rate by topic.
- Analytics ingestion volume and rejection rate.
- Active shops (`count(distinct shop_id)` over `analytics_events` per
  hour).
