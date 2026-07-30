---
name: Vercel self-contained deployment
description: How the frontend and API coexist on the same Vercel domain — no separate API server URL needed.
---

## Rule
Never set VITE_API_URL on Vercel. The frontend and serverless API live on the same domain.

## Architecture
- vercel.json rewrites `/api/:path*` → `api/index.ts` serverless function
- `api/index.ts` exports the Express app (no `app.listen()`)
- Frontend uses relative `/api/...` paths (VITE_API_URL defaults to empty string)
- In dev on Replit: vite.config.ts proxy forwards `/api` → `localhost:8080`
- `app.set('trust proxy', 1)` required for secure cookies behind Vercel's load balancer
- `session.sameSite: "lax"` correct for same-origin (NOT "none" which is cross-origin only)
- `cron/publish.ts` is fail-secure: returns 503 if CRON_SECRET is not set

## Required Vercel env vars
- SUPABASE_DATABASE_URL
- SESSION_SECRET
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- SUPABASE_STORAGE_BUCKET
- CRON_SECRET
- NODE_ENV=production

## Why VITE_API_URL breaks Vercel
VITE_API_URL is baked into the JS bundle at build time. If set to the Replit dev URL in Vercel env vars, every API call from the deployed frontend goes to Replit instead of the Vercel serverless function. The app then breaks whenever Replit sleeps.

## How to apply
- Vercel: delete VITE_API_URL from Project Settings → Environment Variables, then redeploy
- Local dev: vite proxy in vite.config.ts handles routing; no env var needed
- The api/tsconfig.json uses moduleResolution:bundler so workspace package exports fields are respected
