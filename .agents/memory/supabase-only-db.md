---
name: Supabase Only DB
description: Database is exclusively Supabase PostgreSQL — all DATABASE_URL fallback code has been removed.
---

## Rule
`SUPABASE_DATABASE_URL` is the only database environment variable used. `DATABASE_URL` no longer exists in the project.

**Why:** The Replit-provisioned Postgres (DATABASE_URL) was a temporary fallback during migration. Migration to Supabase is complete. The fallback was removed to eliminate ambiguity and ensure every environment (dev, prod) uses the same database.

**How to apply:**
- `lib/db/src/index.ts` — reads only `SUPABASE_DATABASE_URL`; always applies `ssl: { rejectUnauthorized: false }` via `parseDbUrl()`
- `lib/db/drizzle.config.ts` — same, no fallback
- `lib/db/src/seed-admin.ts` — same
- One-time migration scripts (`lib/db/scripts/migrate-to-supabase.mjs`, `apply-to-supabase.mjs`) have been deleted — do not recreate them
- Never re-introduce `|| process.env.DATABASE_URL` into any connection code
- For Vercel deployment: set `SUPABASE_DATABASE_URL` and `SESSION_SECRET` in Vercel env vars; no other DB env vars needed
