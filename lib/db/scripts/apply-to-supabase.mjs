import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const rawUrl = process.env.SUPABASE_DATABASE_URL;
if (!rawUrl) {
  console.error("SUPABASE_DATABASE_URL is not set");
  process.exit(1);
}

// Robust parser — handles passwords containing '@' or '%'
function parseDbUrl(url) {
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

const { host, port, user, password, database } = parseDbUrl(rawUrl);
console.log(`Connecting to: ${host}:${port}/${database} as ${user}`);

const client = new pg.Client({
  host, port, user, password, database,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
  query_timeout: 30000,
});

const sqlFile = path.join(__dirname, "../drizzle/0000_supabase_init.sql");
const raw = fs.readFileSync(sqlFile, "utf8");

// Drizzle generates statements separated by '--> statement-breakpoint'
const statements = raw
  .split("--> statement-breakpoint")
  .map(s => s.trim())
  .filter(Boolean);

console.log(`Applying ${statements.length} SQL statements to Supabase...`);

try {
  await client.connect();
  console.log("Connected.\n");

  let ok = 0, skipped = 0, failed = 0;
  for (const sql of statements) {
    try {
      await client.query(sql);
      ok++;
    } catch (err) {
      if (err.message.includes("already exists")) {
        skipped++;
      } else {
        console.error(`FAILED: ${err.message}\nSQL: ${sql.substring(0, 120)}`);
        failed++;
      }
    }
  }

  console.log(`\nDone — ${ok} applied, ${skipped} already existed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
} finally {
  await client.end();
}
