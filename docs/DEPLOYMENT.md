# Deployment Checklist

Videofy deploys on Lovable's Cloudflare Worker runtime. This checklist is
tailored to that platform; no self-hosted infrastructure is assumed.

## 1. Pre-deploy

- [ ] `bun install` succeeds locally (or in CI).
- [ ] `bunx tsgo --noEmit` is clean.
- [ ] `bun run build` succeeds locally.
- [ ] All environment variables in `docs/ENVIRONMENT.md` are set for the
      target environment.
- [ ] Database migrations have been reviewed and applied
      (`supabase/migrations/*`).
- [ ] Row-Level Security is **enabled** on every table in the `public`
      schema (`supabase db linter` reports zero `rls_disabled_in_public`).
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is present but **never** referenced from
      browser code or module scope in `*.functions.ts`.
- [ ] `APP_VERSION` is set to the current git SHA (surfaces in
      `/api/public/health` and Sentry releases).

## 2. Publish

1. Open the Lovable editor.
2. Click **Publish → Update** (frontend) — backend changes are already
   live from the previous merge.
3. Verify the published URL responds `200` on `/api/public/health`.
4. Optional: attach a custom domain via **Project Settings → Domains**.

## 3. Post-deploy smoke tests

- [ ] `GET /api/public/health` returns `status: "ok"` and `database` check
      is `ok`.
- [ ] The homepage renders without console errors.
- [ ] `/billing`, `/widgets`, `/videos`, `/analytics` render.
- [ ] An external uptime monitor is pointed at `/api/public/health`
      (recommended interval: 60 s).
- [ ] Sentry (if configured) is receiving a test event
      (`monitoring.captureMessage("deploy smoke")`).

## 4. Rollback

Frontend rollback: in the Lovable editor, open **Publish → History** and
re-publish the previous version.

Backend rollback: revert the offending migration in a new migration
(never edit an applied migration file) and re-publish. Data-destructive
rollbacks require a database restore — see `docs/BACKUP.md`.

## 5. Stable URLs

Use these for webhooks, cron jobs, and external integrations — they are
immutable across project renames.

- Production: `project--{project-id}.lovable.app`
- Preview:    `project--{project-id}-dev.lovable.app`
