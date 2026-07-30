import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "@workspace/db";

const PgSession = connectPgSimple(session);

if (!process.env.SESSION_SECRET) {
  // Log but do NOT throw at module load time.
  // Throwing here produces Vercel's opaque FUNCTION_INVOCATION_FAILED.
  // The fallback secret means sessions won't persist across cold starts,
  // but the function will start and serve requests.
  // Fix: set SESSION_SECRET in Vercel → Settings → Environment Variables.
  console.error(
    "[session] WARNING: SESSION_SECRET is not set. " +
    "Sessions will not persist across deployments. " +
    "Set SESSION_SECRET in Vercel → Settings → Environment Variables."
  );
}

export const sessionMiddleware = session({
  store: new PgSession({
    pool,
    tableName: "session",
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET ?? `unsafe-fallback-${Math.random().toString(36)}`,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
});
