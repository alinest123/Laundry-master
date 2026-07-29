import { defineConfig } from "drizzle-kit";
import path from "path";

const rawUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

if (!rawUrl) {
  throw new Error("No database URL found. Set SUPABASE_DATABASE_URL or provision a Replit database.");
}

// Parse robustly so passwords containing '@' or '%' don't break the URL parser.
function parseDbUrl(url: string) {
  const noProto = url.replace(/^postgres(?:ql)?:\/\//, "");
  const lastAt = noProto.lastIndexOf("@");
  const credentials = noProto.substring(0, lastAt);
  const hostPart = noProto.substring(lastAt + 1);

  const firstColon = credentials.indexOf(":");
  const user = credentials.substring(0, firstColon);
  const password = credentials.substring(firstColon + 1);

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
const parsed = parseDbUrl(rawUrl);

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: isSupabase
    ? { host: parsed.host, port: parsed.port, user: parsed.user, password: parsed.password, database: parsed.database, ssl: true }
    : { url: rawUrl },
});
