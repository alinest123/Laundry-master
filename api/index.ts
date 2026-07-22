/**
 * Vercel serverless function — wraps the Express app.
 *
 * Vercel automatically detects an Express app exported as the default export
 * and invokes it as a serverless handler. No app.listen() is called here;
 * that only happens in artifacts/api-server/src/index.ts (the Replit process).
 *
 * Required environment variables on Vercel:
 *   DATABASE_URL  — PostgreSQL connection string (e.g. Neon or Vercel Postgres)
 *   SESSION_SECRET — secret for signed cookies / sessions (if used)
 */
import app from '../artifacts/api-server/src/app';

export default app;
