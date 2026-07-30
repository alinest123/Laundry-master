import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const rawUrl = process.env.SUPABASE_DATABASE_URL;

if (!rawUrl) {
  // Log but do NOT throw at module load time.
  // Throwing here produces Vercel's opaque FUNCTION_INVOCATION_FAILED.
  // Deferring lets the function start and return a useful HTTP 500 instead.
  // Fix: set SUPABASE_DATABASE_URL in Vercel → Settings → Environment Variables.
  console.error(
    "[db] FATAL: SUPABASE_DATABASE_URL is not set. " +
    "Database queries will fail. " +
    "Set SUPABASE_DATABASE_URL in Vercel → Settings → Environment Variables."
  );
}

/**
 * Parse a postgres connection URL robustly — handles passwords that contain
 * special characters like '@' or '%' by splitting on the LAST '@' sign.
 */
function parseDbUrl(url: string) {
  const noProto = url.replace(/^postgres(?:ql)?:\/\//, "");
  const lastAt = noProto.lastIndexOf("@");
  const credentials = noProto.substring(0, lastAt);
  const hostPart = noProto.substring(lastAt + 1);

  const firstColon = credentials.indexOf(":");
  const user = credentials.substring(0, firstColon);
  const password = credentials.substring(firstColon + 1); // raw — may contain @

  const slashIdx = hostPart.indexOf("/");
  const hostAndPort = slashIdx >= 0 ? hostPart.substring(0, slashIdx) : hostPart;
  const rest = slashIdx >= 0 ? hostPart.substring(slashIdx + 1) : "postgres";
  const database = rest.split("?")[0] || "postgres";

  const colonIdx = hostAndPort.lastIndexOf(":");
  const host = colonIdx >= 0 ? hostAndPort.substring(0, colonIdx) : hostAndPort;
  const port = colonIdx >= 0 ? parseInt(hostAndPort.substring(colonIdx + 1), 10) : 5432;

  return { host, port, user, password, database };
}

export const pool = new Pool(
  rawUrl
    ? { ...parseDbUrl(rawUrl), ssl: { rejectUnauthorized: false } }
    : { host: "localhost", port: 5432 } // will fail at first query — not at module load
);

export const db = drizzle(pool, { schema });

export * from "./schema";
