/**
 * Vercel serverless function — wraps the Express app.
 *
 * Vercel automatically detects an Express app exported as the default export
 * and invokes it as a serverless handler. No app.listen() is called here;
 * that only happens in artifacts/api-server/src/index.ts (the Replit process).
 *
 * Required environment variables on Vercel:
 *   SUPABASE_DATABASE_URL — Supabase PostgreSQL connection string
 *   SESSION_SECRET        — random secret for signed session cookies
 *   NODE_ENV=production   — enables rate limiting, HSTS, strict CSP
 *
 * Recommended:
 *   VITE_SITE_URL         — e.g. https://yourdomain.com  (for canonical SEO URLs)
 *   CAL_WEBHOOK_SECRET    — Cal.com webhook signature secret (if using consultations)
 */
import app from '../artifacts/api-server/src/app';

export default app;
