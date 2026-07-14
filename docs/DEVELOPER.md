# Videofy — Developer Handbook

Welcome. This handbook is the single entry point for a new engineer joining
the Videofy project. It links to the deep-dive documents in `docs/` and
summarises everything you need to be productive on day one.

> Frontend is frozen. Do not redesign UI. All active work is backend,
> integrations, and infrastructure.

---

## 1. Architecture Overview

Videofy is a **TanStack Start v1** app (React 19 + Vite 7) that will be
embedded inside Shopify stores as an app + Theme App Extension. The
runtime targets **Cloudflare Workers** (edge) with `nodejs_compat`.

```
┌──────────────────────────┐        ┌──────────────────────────────┐
│  Shopify Storefront      │        │  Shopify Admin (Merchant UI) │
│  (Theme App Extension)   │        │  Embedded Videofy App        │
│  extensions/videofy-theme│        │  src/routes/**               │
└─────────────┬────────────┘        └──────────────┬───────────────┘
              │ widget JSON                       │ RPC (createServerFn)
              ▼                                    ▼
        ┌───────────────────────────────────────────────┐
        │   TanStack Start Worker (edge)                │
        │   - src/routes/api/public/*  (HTTP)           │
        │   - src/lib/api/*.functions.ts (RPC)          │
        │   - src/lib/services/**  (domain services)    │
        └─────────┬────────────────────┬────────────────┘
                  │                    │
                  ▼                    ▼
        ┌──────────────────┐  ┌──────────────────────┐
        │ Lovable Cloud    │  │ Shopify Admin/       │
        │ (Postgres + Auth │  │ Storefront APIs      │
        │  + Storage)      │  │ + Webhooks           │
        └──────────────────┘  └──────────────────────┘
```

Key principles:

- **RPC by default** — internal calls use `createServerFn` from
  `@tanstack/react-start`. Raw HTTP only for webhooks, cron, public reads.
- **RLS everywhere** — all `public.*` tables have policies scoped to the
  authenticated user; `service_role` is used only in server-only modules.
- **Server-only isolation** — anything touching secrets or the admin
  client lives in `*.server.ts`; `.functions.ts` modules load it via
  `await import()` inside handlers.
- **Theme extension is static** — Liquid + vanilla JS + CSS, no build
  step, communicates with the Worker via public `/api/public/widget/*`.

Deeper reference: `docs/PRODUCTION.md`, `docs/API.md`, `docs/SECURITY.md`.

---

## 2. Folder Structure

```
videofy/
├── docs/                         # All documentation (start here)
│   ├── DEVELOPER.md              # ← you are here
│   ├── API.md / openapi.yaml     # HTTP + RPC surface
│   ├── DEPLOYMENT.md             # release + rollback
│   ├── ENVIRONMENT.md            # env vars per tier
│   ├── SECURITY.md               # RLS, HMAC, secrets
│   ├── BACKUP.md                 # RPO/RTO, restore drills
│   ├── MONITORING.md             # logging + alerts
│   └── PRODUCTION.md             # production readiness index
│
├── extensions/videofy-theme/     # Shopify Theme App Extension
│   ├── blocks/                   # merchant-selectable blocks
│   ├── snippets/ · assets/ · locales/
│   └── shopify.extension.toml
│
├── src/
│   ├── routes/                   # File-based routing (TanStack)
│   │   ├── __root.tsx            # HTML shell, providers, SEO defaults
│   │   ├── index.tsx             # Dashboard
│   │   ├── _authenticated/       # Auth-gated subtree (ssr:false)
│   │   └── api/public/           # HTTP endpoints (webhooks, widget, health)
│   │
│   ├── lib/
│   │   ├── api/*.functions.ts    # createServerFn RPC endpoints
│   │   ├── services/**/*.server  # Domain services (Shopify, storage, video)
│   │   ├── db/repository.server  # Data access helpers
│   │   ├── security/             # HMAC, rate-limit
│   │   ├── validation/schemas    # Zod schemas (source of truth for DTOs)
│   │   ├── monitoring.ts         # Sentry facade
│   │   ├── logger.ts · errors.ts · env.ts · types.ts
│   │
│   ├── integrations/supabase/    # AUTO-GENERATED — do not edit
│   ├── components/               # UI (shadcn-based) — frozen
│   ├── stores/                   # Zustand stores (mock; sunset in Phase 3)
│   ├── hooks/ · styles.css · start.ts · router.tsx · routeTree.gen.ts
│
├── supabase/
│   ├── config.toml
│   └── migrations/*.sql
│
├── package.json · vite.config.ts · tsconfig.json · bun.lock
```

Rules:
- New route pages → `src/routes/*.tsx` (flat, dot-separated).
- New HTTP endpoints → `src/routes/api/public/*.ts`.
- New RPC endpoints → `src/lib/api/<domain>.functions.ts`.
- New server-only logic → `src/lib/services/<domain>/*.server.ts`.
- Never put callable server logic under `src/server/` (blocked from client bundle).

---

## 3. Environment Variables

Canonical reference: **`docs/ENVIRONMENT.md`**. Quick summary:

| Scope | Variable | Purpose |
| --- | --- | --- |
| Client (`VITE_`) | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` | Browser Supabase client |
| Server | `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Server clients + admin |
| Shopify | `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_APP_URL`, `SHOPIFY_SCOPES`, `SHOPIFY_WEBHOOK_SECRET` | App auth + webhooks |
| Storage | `STORAGE_PROVIDER` + provider vars (Mux/Cloudinary/S3) | Video pipeline |
| Monitoring | `SENTRY_DSN`, `LOG_LEVEL` | Errors + logs |
| App | `APP_ENV`, `APP_BASE_URL` | Runtime config |

`.env` is for local dev only (never commit secrets). Production values live in
the Cloudflare / Lovable Cloud secret store. Access secrets **only** inside
`.handler()` bodies or server-only modules — never at module scope of shared files.

---

## 4. Setup Guide

Prereqs: **Bun ≥ 1.1**, Node 20 for tooling parity, Git.

```bash
git clone <repo> videofy && cd videofy
bun install
cp .env.example .env       # fill VITE_SUPABASE_* + SUPABASE_* at minimum
bun run dev                # http://localhost:8080
```

First-run checks:
- `bun run typecheck` passes (zero TS errors).
- `bun run build` succeeds against a production build.
- Visiting `/api/public/health` returns `{ status: "ok" }`.

Editor: enable the Biome/ESLint + Tailwind v4 extensions. Do not edit any
file marked auto-generated (see next section).

---

## 5. Local Development Guide

Daily loop:
1. `bun run dev` — Vite HMR at `http://localhost:8080`.
2. Add/modify a route file under `src/routes/`; the plugin regenerates
   `src/routeTree.gen.ts` — **never edit that file by hand**.
3. Add a server call: create `src/lib/api/<domain>.functions.ts` with
   `createServerFn().inputValidator(...).handler(...)`. Import from a
   component or loader; call event-handler versions via `useServerFn`.
4. Add a table: use the **migration tool** (see Database Guide). Never run
   raw `psql` against production.
5. Verify: prefer targeted checks (build output, RPC call, network tab)
   over full manual QA.

Auto-generated / off-limits files:
- `src/routeTree.gen.ts`
- `src/integrations/supabase/{client,client.server,auth-attacher,auth-middleware,types}.ts`
- `supabase/config.toml`
- `.env` (managed values injected by Lovable Cloud)

Debugging:
- Client: browser devtools + `src/lib/logger.ts`.
- Server: `console.*` inside handlers surfaces in the Worker log stream.
- Errors: routed through `src/lib/monitoring.ts` (Sentry when `SENTRY_DSN` set).

---

## 6. Deployment Guide

Full checklist: **`docs/DEPLOYMENT.md`**. TL;DR:

1. `bun run typecheck && bun run build` — must be green.
2. Merge to `main` — Lovable Cloud deploys the Worker automatically.
3. Backend changes (server fns, edge routes, migrations) are **live
   immediately**. Frontend changes require pressing **Publish** in the
   Lovable editor.
4. Smoke: `curl https://videof.lovable.app/api/public/health` and open the
   dashboard.
5. Rollback: re-publish the previous successful build from the editor
   history; migrations require a manual revert migration.

Environments:
- Preview: `id-preview--<project>.lovable.app`
- Stable dev URL: `project--<id>-dev.lovable.app`
- Production: `videof.lovable.app` (+ custom domain when configured)

---

## 7. Database Guide

Backend is **Postgres via Lovable Cloud** (managed Supabase). All changes
go through the migration tool — no ad-hoc SQL in production.

Rules (see `docs/SECURITY.md`):
- Every `CREATE TABLE public.*` migration MUST include:
  1. `CREATE TABLE`
  2. `GRANT` to `authenticated` (+ `anon` only if publicly readable) and
     `service_role`
  3. `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
  4. `CREATE POLICY ...` scoped by `auth.uid()` (or `has_shop_access`)
- Never reference `auth.users` with a FK; use a `profiles` table.
- Roles live in `public.user_roles`; check via `has_shop_role(uid, shop, role)`.
- Timestamps: `created_at` / `updated_at` + `touch_updated_at` trigger.
- Time-dependent rules → triggers, not `CHECK` constraints.

Reading/writing from code:
- User-scoped: `requireSupabaseAuth` middleware → `context.supabase`.
- Public read-only: server publishable client (see `src/lib/db/repository.server.ts`).
- Privileged: `await import("@/integrations/supabase/client.server")` **inside** the handler.

---

## 8. API Guide

Two surfaces (full spec in **`docs/API.md`** + **`docs/openapi.yaml`**):

**A. Public HTTP** — `src/routes/api/public/**`
- `GET /api/public/health` — liveness + DB round-trip
- `GET /api/public/widget/:id` — public widget JSON for theme extension
- `POST /api/public/analytics/track` — rate-limited event ingestion
- `POST /api/public/shopify/webhooks/*` — HMAC-verified webhooks (GDPR + sync)

Rules: verify signatures (`src/lib/security/hmac.server.ts`), validate with
Zod, never return PII, never mutate without auth.

**B. Internal RPC** — `src/lib/api/*.functions.ts`
- Domains: videos, widgets, products, collections, customers, analytics,
  billing, notifications, settings, profile, media.
- Auth: `.middleware([requireSupabaseAuth])` for user-scoped calls.
- Call from components via `useServerFn`; call from loaders under
  `_authenticated/` only.

Error contract: throw `AppError` (`src/lib/errors.ts`) → serialised to
`{ code, message, details? }`. Client uses TanStack Query for caching.

---

## 9. Widget System Guide

The Theme App Extension lives at `extensions/videofy-theme/`. It's plain
Liquid + JS + CSS — no bundler.

Flow:
1. Merchant adds a block (product / collection / hero / grid / story /
   homepage-carousel) via Shopify's theme editor.
2. `snippets/videofy-loader.liquid` injects `assets/videofy-loader.js` once
   per page (guarded by `window.__videofyLoaded`).
3. Loader finds `[data-videofy-widget]` containers and calls
   `GET /api/public/widget/:id` to fetch the widget config + video list.
4. `assets/videofy-widget.js` renders the layout (grid, carousel, story)
   and wires interaction events.
5. Interactions POST to `/api/public/analytics/track` (batched, keepalive).

Server side:
- Config source: `widgets` table (see migrations).
- Service: `src/lib/services/widget/widget-service.server.ts`.
- Public route: `src/routes/api/public/widget/$id.ts` — cached, safe
  columns only, honours widget visibility state.
- Custom CSS is stored per-widget; theme sanitises before injection.

Adding a new block:
1. Create `blocks/<name>.liquid` and register it in `shopify.extension.toml`.
2. Extend `videofy-widget.js` with a renderer if it introduces a new layout.
3. Extend `widgets` schema + `widget-service` to support new config fields.
4. Update `docs/openapi.yaml` if the public shape changes.

---

## 10. Analytics Guide

Ingestion is intentionally cheap: unauthenticated `POST` with a JSON batch,
strict rate-limit, no PII (see `src/routes/api/public/analytics/track.ts`).

Pipeline:
1. Widget/dashboard emits events (`impression`, `play`, `add_to_cart`, ...).
2. Public route validates payload with Zod (`src/lib/validation/schemas.ts`)
   and applies `rate-limit.server.ts`.
3. `src/lib/services/analytics/analytics-service.server.ts` normalises and
   inserts into `analytics_events`.
4. Aggregations live in materialised views / server functions in
   `src/lib/api/analytics.functions.ts`, consumed by the dashboard via
   TanStack Query.

Retention & PII: no user identifiers beyond opaque session hashes; raw
events expire per `docs/BACKUP.md`. All aggregate reads are RLS-scoped.

Adding a new event type:
1. Extend `AnalyticsEvent` schema in `validation/schemas.ts`.
2. Handle it in `analytics-service.server.ts`.
3. Expose via a query on `analytics.functions.ts`.
4. Add chart usage in dashboard components (frozen — coordinate first).

---

## 11. Billing Guide

Billing uses Shopify's Managed Pricing / Billing API. Do **not** wire
Stripe/Paddle for merchant subscriptions — Shopify requires its own API.

Server surface:
- `src/lib/services/shopify/billing-service.server.ts` — creates
  RecurringApplicationCharges, validates callbacks, syncs plan state.
- `src/lib/services/billing/billing-service.server.ts` — internal facade
  used by RPC and UI.
- `src/lib/api/billing.functions.ts` — `startSubscription`,
  `getCurrentPlan`, `cancelSubscription`, `listInvoices`.

Flow:
1. Merchant picks a plan in `/billing`.
2. `startSubscription` returns a Shopify `confirmationUrl`; UI redirects.
3. Shopify redirects back to `/api/public/shopify/billing/callback`
   (added when credentials are provisioned) with `charge_id`.
4. Callback verifies with Shopify Admin API, persists `subscriptions` row,
   updates `shops.plan`.
5. Webhook `app_subscriptions/update` keeps state fresh; uninstall webhook
   cancels active charges.

Testing without Shopify credentials: use the mock plan store still present
in `src/stores/`; production cut-over swaps to the real service (Phase 3).

Invoices: `listInvoices` reads from `invoices` table; PDFs are fetched via
Shopify Admin (no local storage of billing PDFs).

---

## 12. Where to go next

- Ship a bug fix → read `docs/DEPLOYMENT.md`
- Add an endpoint → read `docs/API.md`
- Touch the DB → read `docs/SECURITY.md` + this Database Guide
- Investigate an incident → `docs/MONITORING.md` + `docs/BACKUP.md`
- Prep for launch → `docs/PRODUCTION.md`

Welcome aboard.
