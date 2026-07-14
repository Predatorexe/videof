# Backup & Recovery Strategy

Videofy stores durable state in two systems: **Lovable Cloud (Postgres)**
and the configured **media provider** (Cloudinary / Mux / S3).

## 1. Postgres (Lovable Cloud)

Lovable Cloud takes automated daily backups managed by the underlying
Supabase platform. Retention follows the project's plan.

**Manual export (on-demand):**

1. Open the Cloud tab.
2. Go to **Advanced settings → Export data**.
3. Wait for the notification; download the archive.

**Recommended cadence:**

- Automated daily snapshots — always on.
- On-demand export before any destructive migration (drop column,
  data backfill, tenant purge).
- Quarterly restore drill into a staging project to validate the archive
  is complete and importable.

**Restore path:**

1. Provision a new Cloud project.
2. Import the archive via **Advanced settings → Import data**.
3. Repoint `SUPABASE_URL` / `SUPABASE_*_KEY` env vars.
4. Re-run `supabase db linter` and verify RLS is enabled everywhere.

## 2. Media assets

All uploaded video assets live with the storage provider — Videofy never
holds the only copy. Recovery is provider-native:

| Provider   | Backup mechanism                                                    |
| ---------- | ------------------------------------------------------------------- |
| Cloudinary | Built-in "Backup" add-on (versioned copies in a customer-owned S3). |
| Mux        | Master assets retained by Mux; enable "Master Access" per asset.    |
| S3 / R2    | Enable bucket versioning and cross-region replication.              |

The `videos` table stores the provider `asset_id` and public URLs — after
a restore of both Postgres and the media provider, no application-level
reconciliation is required.

## 3. Configuration

- Environment variables are stored in Lovable Cloud → Secrets. Export
  a **name-only** inventory quarterly (values are never exported).
- `supabase/migrations/*` in git IS the schema backup — always keep
  every migration file, never rewrite history.

## 4. RPO / RTO targets

| Data class       | RPO      | RTO      | Notes                              |
| ---------------- | -------- | -------- | ---------------------------------- |
| Postgres         | ≤ 24 h   | ≤ 2 h    | Daily snapshot + on-demand export  |
| Media assets     | 0        | ≤ 1 h    | Provider-native redundancy         |
| Configuration    | Real-time| ≤ 15 min | Migrations in git, secrets in Cloud|

## 5. Incident response

1. Snapshot current state before any recovery action.
2. Restore into a **new** project, verify, then swap DNS / env vars.
3. Post-incident: log timeline in `docs/INCIDENTS/YYYY-MM-DD.md`
   (create the file per incident; not tracked here).
