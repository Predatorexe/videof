# Videofy API

Two API surfaces coexist:

1. **Public HTTP routes** under `/api/public/*` — stable, versionless,
   callable from any client (storefront runtime, Shopify webhooks,
   uptime monitors). Documented in `docs/openapi.yaml`.
2. **Server functions** invoked via TanStack Start RPC at
   `POST /_serverFn/{id}`. These are the app-internal API used by the
   admin UI. Their request/response contract is documented in
   `docs/openapi.yaml` for completeness, but callers should invoke them
   through the generated wrappers in `src/lib/api/*.functions.ts` (via
   `useServerFn`) — **not** by hand-rolling HTTP requests, because the
   wire format is TanStack's internal RPC serialization, not plain JSON.

## Authentication

| Surface                                | Auth                                            |
| -------------------------------------- | ----------------------------------------------- |
| `/api/public/health`                   | None                                            |
| `/api/public/analytics/track`          | None (rate-limited per IP: 120 req / 60 s)      |
| `/api/public/widget/{id}`              | None (returns only `published` widgets)         |
| `/api/public/shopify/webhooks/*`       | Shopify HMAC (`X-Shopify-Hmac-Sha256`)          |
| `POST /_serverFn/*`                    | Supabase bearer token (`Authorization: Bearer`) |

The bearer token is issued by Lovable Cloud auth (Supabase). The client
`functionMiddleware` in `src/start.ts` attaches it automatically for
all `useServerFn` calls.

## Errors

All JSON error responses follow `ErrorDTO`:

```json
{ "status": 404, "code": "not_found", "message": "widget", "details": { } }
```

Standard `code` values: `bad_request`, `unauthorized`, `forbidden`,
`not_found`, `conflict`, `unprocessable`, `rate_limited`,
`internal_error`.

## Pagination

Endpoints that accept `page` + `pageSize` return:

```json
{ "items": [...], "total": 123, "page": 1, "pageSize": 20 }
```

`page` defaults to `1`, `pageSize` defaults to `20`, hard maximum `100`.

## Validation

All inputs are validated with Zod (`src/lib/validation/schemas.ts`).
On failure the response is `422 unprocessable` with Zod issues in
`details.issues`.

See `docs/openapi.yaml` for the machine-readable spec (OpenAPI 3.1).
