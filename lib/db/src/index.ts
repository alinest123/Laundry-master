import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const rawUrl = process.env.SUPABASE_DATABASE_URL;

if (!rawUrl) {
  throw new Error("SUPABASE_DATABASE_URL is required. Set it in your environment secrets.");
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

// Supabase session-mode pooler caps at 15 total connections across ALL clients.
// Vercel serverless + Replit dev can easily exceed that with the default max=10.
// Keep max=2 so up to ~6 concurrent Vercel invocations + local stay under the limit.
const parsed = parseDbUrl(rawUrl);

// Supabase session-mode pooler (*.pooler.supabase.com:5432) has a hard limit of
// 15 total connections across ALL clients.  Vercel serverless creates a new Pool
// per invocation, so even max:2 can exhaust that limit with ~8 concurrent requests.
//
// Transaction mode (port 6543) multiplexes many clients over fewer server connections
// and is designed for serverless — connection limits are ~100+ on the free tier.
// Automatically switch when the URL targets the Supabase pooler on port 5432.
const host = parsed.host;
const useTransactionMode =
  host.endsWith('.pooler.supabase.com') && parsed.port === 5432;

export const pool = new Pool({
  ...parsed,
  port: useTransactionMode ? 6543 : parsed.port,
  ssl: { rejectUnauthorized: false },
  // One connection per serverless process is sufficient and prevents exhausting
  // the pooler limit even under high concurrency.
  max: 1,
  idleTimeoutMillis: 3_000,
  connectionTimeoutMillis: 10_000,
});

export const db = drizzle(pool, { schema });

export * from "./schema";
