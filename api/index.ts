/**
 * Vercel serverless function — wraps the pre-compiled Express app.
 *
 * WHY A PRE-BUILT BUNDLE:
 * Vercel's @vercel/node runtime compiles api/index.ts to CommonJS (CJS).
 * All workspace packages (@workspace/db, @workspace/api-zod, etc.) export
 * TypeScript source files via their package.json exports field. Vercel's
 * bundler cannot reliably compile TypeScript from workspace exports fields,
 * and CJS cannot require() a .mjs (ESM) file at runtime.
 *
 * The solution: api-server's own esbuild pipeline (build.mjs) produces
 * dist/app.cjs — a fully self-contained CJS bundle with all workspace
 * dependencies already inlined. Vercel just needs to require() a plain JS
 * file. No workspace TypeScript compilation required at deploy time.
 *
 * BUILD ORDER (handled by vercel.json buildCommand):
 *   1. pnpm --filter @workspace/api-server run build
 *      → artifacts/api-server/dist/app.cjs   (Express app, CJS, no listen)
 *      → artifacts/api-server/dist/index.mjs  (full server, ESM, with listen)
 *   2. pnpm --filter @workspace/textile-platform run build
 *      → artifacts/textile-platform/dist/public/  (SPA static files)
 *
 * REQUIRED ENVIRONMENT VARIABLES ON VERCEL:
 *   NODE_ENV=production          — enables rate limiting, HSTS, strict CSP
 *   SUPABASE_DATABASE_URL        — Supabase PostgreSQL connection string
 *   SESSION_SECRET               — random secret for signed session cookies
 *   SUPABASE_URL                 — Supabase project URL (for Storage)
 *   SUPABASE_SERVICE_ROLE_KEY    — Supabase admin key (for Storage signing)
 *   SUPABASE_STORAGE_BUCKET      — storage bucket name
 *   CRON_SECRET                  — protects the /api/cron/publish endpoint
 */

// @ts-ignore — CJS bundle; compiled by api-server build step before Vercel deploys
import app from '../artifacts/api-server/dist/app.cjs';

export default app;
