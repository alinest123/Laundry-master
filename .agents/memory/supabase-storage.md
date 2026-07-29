---
name: Supabase Storage architecture
description: How file uploads work after the Replit GCS → Supabase Storage migration.
---

## Rule
All file uploads use Supabase Storage. The server generates a signed upload URL; the client PUTs directly to Supabase; the permanent public URL is stored in the DB.

## Upload flow
1. Client → `POST /api/storage/uploads/request-url` with `{ name, size, contentType }`
2. Server calls `supabase.storage.from(bucket).createSignedUploadUrl(path)` → returns `{ uploadURL, objectPath, servingUrl }`
3. Client PUTs file to `uploadURL` (direct to Supabase, not proxied)
4. Client stores `servingUrl` (a permanent `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/uploads/${uuid}`)

## Required env vars (server-side)
- `SUPABASE_URL` — https://xxx.supabase.co
- `SUPABASE_SERVICE_ROLE_KEY` — service role key from Supabase API settings
- `SUPABASE_STORAGE_BUCKET` — name of public bucket (default: `media`)
- `CRON_SECRET` — protects POST /api/cron/publish

## Backward compat
- Old `/storage/objects/*` proxy route still exists and redirects to Supabase public URL
- Old GCS paths are gracefully mapped (won't work, will 404 at Supabase)

## Why
Replit GCS sidecar at `127.0.0.1:1106` only works inside Replit; fails on Vercel serverless.

## How to apply
- New bucket must be PUBLIC (Supabase Storage → New bucket → toggle public)
- Bucket name must match `SUPABASE_STORAGE_BUCKET`
- All upload consumers use `servingUrl` from API response — never construct `/api/storage/objects/...` paths
