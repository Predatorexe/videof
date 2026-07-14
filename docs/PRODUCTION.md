# Production Readiness — Index

Videofy is architected to run on Lovable's Cloudflare Worker runtime with
Lovable Cloud (Postgres) as the primary data store. This document is the
top-level index; each linked file is authoritative for its domain.

| Area                                | File                       |
| ----------------------------------- | -------------------------- |
| Environment variables               | `docs/ENVIRONMENT.md`      |
| Deployment checklist                | `docs/DEPLOYMENT.md`       |
| Security checklist                  | `docs/SECURITY.md`         |
| Backup & recovery                   | `docs/BACKUP.md`           |
| Logging, monitoring, alerting       | `docs/MONITORING.md`       |

## Production features implemented

- **Health endpoint** — `src/routes/api/public/health.ts`
  (`GET` and `HEAD`, database round-trip, per-check status, `503` on
  failure).
- **Structured JSON logger** — `src/lib/logger.ts` with `child()` for
  request-scoped bindings.
- **Monitoring facade** — `src/lib/monitoring.ts` with automatic Sentry
  activation via `SENTRY_DSN` / `VITE_SENTRY_DSN`; falls back to the
  Lovable in-editor error stream when Sentry is not configured.
- **Global error boundaries** — root `errorComponent` and
  `notFoundComponent` in `src/routes/__root.tsx`; unhandled server errors
  rendered by `src/lib/error-page.ts` via `errorMiddleware`.
- **Out-of-band error capture** — `src/lib/error-capture.ts` preserves
  the original stack across the h3 boundary.
- **HMAC-verified webhooks** — `src/lib/security/hmac.server.ts` used by
  every route under `/api/public/shopify/webhooks/`.
- **Rate limiting** — `src/lib/security/rate-limit.server.ts`.
- **Row-Level Security** — enabled on every `public.*` table in
  `supabase/migrations/*`.

## What still requires external accounts

None of the following block a first production deploy of the frontend +
Lovable Cloud backend; they gate the Shopify go-live and are documented
here for completeness:

- Shopify Partner app (OAuth, App Bridge, Billing API, Theme extension
  deploy).
- Sentry project + DSN.
- Media provider account (Cloudinary / Mux / S3).
- External uptime monitor pointed at `/api/public/health`.
