# Security Checklist

## Application

- [ ] Row-Level Security enabled on every `public.*` table.
- [ ] Every table has explicit `GRANT` statements matching its policies.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` never imported at module scope in a
      `*.functions.ts` file — always `await import(...)` inside handlers.
- [ ] No service-role client used for ordinary user reads; use
      `requireSupabaseAuth` (RLS as user) or a publishable-key client
      with narrow `TO anon` SELECT policies for public read-only data.
- [ ] Every server function that mutates data uses `requireSupabaseAuth`
      **or** verifies a signed webhook before writing.
- [ ] Every `/api/public/*` route validates input with Zod.
- [ ] Every webhook route performs HMAC verification with a
      timing-safe compare over the **raw** request body.
- [ ] Rate limiter (`src/lib/security/rate-limit.server.ts`) attached to
      every unauthenticated write endpoint, including
      `/api/public/analytics/track`.
- [ ] No PII returned from `/api/public/*` endpoints.

## Auth

- [ ] Anonymous sign-ups disabled unless explicitly required.
- [ ] Email auto-confirm disabled in production.
- [ ] Leaked-password protection (HIBP) enabled.
- [ ] OAuth `redirect_uri` is a same-origin **public** URL — never a
      route under `_authenticated/`.
- [ ] Password minimum length ≥ 12.

## Secrets

- [ ] No secret values in git (`.env`, migrations, comments).
- [ ] No secret values in client bundle (no `VITE_` prefix on service
      credentials).
- [ ] Managed via Lovable Cloud → Secrets; rotation policy documented.

## Transport & headers

- [ ] All traffic HTTPS (enforced by Lovable hosting).
- [ ] `Cache-Control: no-store` on authenticated responses.
- [ ] `/api/public/health` served with `no-store`.
- [ ] JSON error responses never include stack traces in production.

## Client

- [ ] `custom_css` from widget config is scoped to the widget container
      when possible; documented as trusted-author input.
- [ ] `dangerouslySetInnerHTML` audited — no unsanitised user input.
- [ ] No `eval`, no `Function(...)` constructors in application code.

## Dependencies

- [ ] `bunx npm audit --audit-level=high` reports zero high/critical.
- [ ] Dependabot / Renovate configured (or manual weekly review).
