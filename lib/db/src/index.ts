import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

// Prefer Supabase when configured, fall back to Replit-provisioned DB.
const rawUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

if (!rawUrl) {
  throw new Error(
    "No database URL found. Set SUPABASE_DATABASE_URL or provision a Replit database.",
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

const isSupabase = !!process.env.SUPABASE_DATABASE_URL;
const poolConfig = isSupabase
  ? { ...parseDbUrl(rawUrl), ssl: { rejectUnauthorized: false } }
  : { connectionString: rawUrl };

export const pool = new Pool(poolConfig);
export const db = drizzle(pool, { schema });

export * from "./schema";
