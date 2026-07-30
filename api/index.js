'use strict';
/**
 * Vercel serverless function — loads the pre-built CommonJS Express bundle.
 *
 * api/index.ts (TypeScript source) is intentionally NOT used here.
 * Importing TypeScript source that pulls in ESM workspace packages
 * (e.g. @workspace/db with "type":"module") causes:
 *   SyntaxError: Cannot use import statement outside a module
 * because the root package.json has no "type":"module" and Vercel's Node
 * runtime treats the compiled output as CommonJS.
 *
 * Instead, the Express app is pre-compiled to a self-contained CJS bundle
 * (dist/app.cjs) by:  pnpm --filter @workspace/api-server run build
 * That build runs before Vercel packages this function (see vercel.json).
 *
 * Required environment variables on Vercel:
 *   SUPABASE_DATABASE_URL — Supabase PostgreSQL connection string
 *   SESSION_SECRET        — random secret for signed session cookies
 *   NODE_ENV=production   — enables rate limiting, HSTS, strict CSP
 *
 * Recommended:
 *   VITE_SITE_URL         — e.g. https://yourdomain.com (canonical SEO URLs)
 *   CAL_WEBHOOK_SECRET    — Cal.com webhook signature secret
 */
const app = require('../artifacts/api-server/dist/app.cjs');

// esbuild CJS bundles export the default export on module.exports.default
// when the source uses `export default`.  Handle both shapes.
module.exports = app.default ?? app;
