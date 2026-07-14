# Environment Variables

Videofy separates variables into three tiers. **Never** commit secrets to
git — the tables below only document *names*, *shape*, and *source*.

| Prefix / Access                        | Where to set                                   | Read from                        |
| -------------------------------------- | ---------------------------------------------- | -------------------------------- |
| `VITE_*` (public, embedded in bundle)  | `.env` (committed keys only) or Lovable Cloud  | `import.meta.env.VITE_*`         |
| Runtime secrets (server only)          | Lovable Cloud → Secrets                        | `process.env.*` **inside a handler** |
| Build secrets (private npm registries) | Workspace Settings → Build Secrets             | injected during `bun install`    |

> **Rule:** never read `process.env.*` at module scope in shared files —
> Cloudflare Workers inject env per-request. Read inside the handler body.

---

## 1. Core (required)

| Name                             | Tier         | Purpose                                          |
| -------------------------------- | ------------ | ------------------------------------------------ |
| `VITE_SUPABASE_URL`              | public       | Lovable Cloud project URL (browser client)       |
| `VITE_SUPABASE_PUBLISHABLE_KEY`  | public       | Publishable / anon key                           |
| `VITE_SUPABASE_PROJECT_ID`       | public       | Project ref, used by generated client            |
| `SUPABASE_URL`                   | server       | Same URL, server-side                            |
| `SUPABASE_PUBLISHABLE_KEY`       | server       | Same publishable key, server-side                |
| `SUPABASE_SERVICE_ROLE_KEY`      | server (🔒)  | Admin key — privileged writes only               |

## 2. Application

| Name                | Default        | Purpose                                                    |
| ------------------- | -------------- | ---------------------------------------------------------- |
| `APP_ENV`           | `production`   | `production` \| `preview` \| `development`                 |
| `APP_VERSION`       | `dev`          | Git SHA or semver; surfaced in `/api/public/health`        |
| `LOG_LEVEL`         | `info`         | `debug` \| `info` \| `warn` \| `error`                     |
| `VITE_APP_ENV`      | `production`   | Same as `APP_ENV`, browser-visible                         |
| `VITE_APP_VERSION`  | `dev`          | Same as `APP_VERSION`, browser-visible                     |

## 3. Monitoring (optional)

Sentry is entirely optional. When these are absent, the Lovable in-editor
error stream is still active — no code change required.

| Name                | Tier      | Purpose                                    |
| ------------------- | --------- | ------------------------------------------ |
| `SENTRY_DSN`        | server    | Server-side Sentry ingest DSN              |
| `VITE_SENTRY_DSN`   | public    | Browser Sentry ingest DSN                  |

## 4. Media storage (pick one)

Set `MEDIA_PROVIDER` to `cloudinary` (default), `mux`, or `s3` and provide
the matching credentials.

| Provider   | Required secrets                                                                        |
| ---------- | --------------------------------------------------------------------------------------- |
| Cloudinary | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`                  |
| Mux        | `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`                                                      |
| S3 / R2    | `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_REGION`, `S3_BUCKET`, `S3_ENDPOINT?`    |

## 5. Shopify (add once Partner app exists — not required for a first deploy)

`SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_APP_URL`,
`SHOPIFY_SCOPES`, `SHOPIFY_API_VERSION` (defaults to `2025-01`),
`SHOPIFY_WEBHOOK_SECRET`.

---

## Adding a secret

Runtime secrets live in Lovable Cloud → Secrets and are automatically
available to server functions and server routes. Never place them in `.env`,
never log them, and never expose them to the browser bundle (no `VITE_`
prefix on service keys).
