import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "@workspace/db";

const PgSession = connectPgSimple(session);

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET env var must be set");
}

export const sessionMiddleware = session({
  store: new PgSession({
    pool,
    tableName: "session",
    // Create the session table automatically if it doesn't exist.
    // connect-pg-simple's SQL schema will be applied on first boot.
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    // On Vercel (HTTPS, same-origin), secure:true is required.
    // app.set('trust proxy', 1) in app.ts ensures Express sees the
    // connection as HTTPS even behind Vercel's TLS-terminating proxy.
    secure: process.env.NODE_ENV === "production",
    // "lax" is correct for a same-origin SPA — the frontend and API live
    // on the same domain on Vercel. "none" is only needed for cross-origin
    // (e.g. a separate API server on a different domain).
    sameSite: process.env.NODE_ENV === "production" ? "lax" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
});
