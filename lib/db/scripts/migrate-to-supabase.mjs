/**
 * migrate-to-supabase.mjs
 * Copies every table from the Replit Postgres DB → Supabase,
 * then resets all serial sequences so future inserts continue correctly.
 */

import pg from "pg";

// ── Connection helpers ────────────────────────────────────────────────────────

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

const srcUrl  = process.env.DATABASE_URL;
const destUrl = process.env.SUPABASE_DATABASE_URL;

if (!srcUrl || !destUrl) {
  console.error("Both DATABASE_URL and SUPABASE_DATABASE_URL must be set.");
  process.exit(1);
}

const srcClient  = new pg.Client({ connectionString: srcUrl, connectionTimeoutMillis: 15000 });
const destParsed = parseDbUrl(destUrl);
const destClient = new pg.Client({
  ...destParsed,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

// ── Table order (FK-safe) ─────────────────────────────────────────────────────
// Tables with no FK deps come first; junction/child tables come last.

const TABLE_ORDER = [
  "users",
  "categories",        // self-ref parent_id — rows inserted by id asc, safe
  "authors",
  "tags",
  "fabrics",
  "stains",
  "experts",
  "services",
  "testimonials",
  "newsletter_subscribers",
  "media_library",
  "redirects",
  "site_settings",
  "page_content",
  "articles",          // refs authors
  "article_categories",
  "article_tags",
  "article_images",
  "article_faqs",
  "article_references",
  "article_related",
  "article_comments",  // refs articles + users
  "article_revisions", // refs articles + users
  "saved_articles",    // refs articles + users
  "appointments",      // refs experts + users
  "zoom_meetings",
  "payments",
  "audit_logs",        // refs users
  "security_logs",
  // skip: session (transient data)
];

// ── Helpers ───────────────────────────────────────────────────────────────────

async function copyTable(table) {
  const { rows } = await srcClient.query(
    `SELECT * FROM "${table}" ORDER BY id ASC`
  );

  if (rows.length === 0) {
    console.log(`  ${table}: empty, skipped`);
    return;
  }

  const cols = Object.keys(rows[0]);
  const colList = cols.map(c => `"${c}"`).join(", ");

  let inserted = 0, skipped = 0;

  for (const row of rows) {
    const vals = cols.map(c => row[c]);
    const placeholders = vals.map((_, i) => `$${i + 1}`).join(", ");
    try {
      await destClient.query(
        `INSERT INTO "${table}" (${colList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
        vals
      );
      inserted++;
    } catch (err) {
      console.error(`    ✗ row id=${row.id}: ${err.message}`);
      skipped++;
    }
  }

  // Reset sequence so next INSERT gets a fresh id
  try {
    await destClient.query(
      `SELECT setval(
         pg_get_serial_sequence('"${table}"', 'id'),
         COALESCE((SELECT MAX(id) FROM "${table}"), 0) + 1,
         false
       )`
    );
  } catch (_) {
    // table has no serial id column — fine
  }

  console.log(`  ${table}: ${inserted} rows inserted${skipped ? `, ${skipped} skipped` : ""}`);
}

// ── Tables without an 'id' column (need a different copy strategy) ────────────

const NO_ID_TABLES = [
  "article_categories",
  "article_tags",
  "article_related",
];

async function copyNoIdTable(table) {
  const { rows } = await srcClient.query(`SELECT * FROM "${table}"`);

  if (rows.length === 0) {
    console.log(`  ${table}: empty, skipped`);
    return;
  }

  const cols = Object.keys(rows[0]);
  const colList = cols.map(c => `"${c}"`).join(", ");
  let inserted = 0, skipped = 0;

  for (const row of rows) {
    const vals = cols.map(c => row[c]);
    const placeholders = vals.map((_, i) => `$${i + 1}`).join(", ");
    try {
      await destClient.query(
        `INSERT INTO "${table}" (${colList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
        vals
      );
      inserted++;
    } catch (err) {
      skipped++;
    }
  }

  console.log(`  ${table}: ${inserted} rows inserted${skipped ? `, ${skipped} skipped` : ""}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

console.log("Connecting to source (Replit DB) and destination (Supabase)...");
await Promise.all([srcClient.connect(), destClient.connect()]);
console.log("Both connected.\n");

// Disable FK triggers on Supabase for the duration of the import
// (requires the postgres role — works on Supabase)
try {
  await destClient.query("SET session_replication_role = replica");
  console.log("FK checks disabled for import.\n");
} catch (e) {
  console.log("Could not disable FK checks — continuing in FK-safe order.\n");
}

for (const table of TABLE_ORDER) {
  if (NO_ID_TABLES.includes(table)) {
    await copyNoIdTable(table);
  } else {
    try {
      await copyTable(table);
    } catch (err) {
      // Table might not have an id column
      if (err.message.includes("column") && err.message.includes("does not exist")) {
        await copyNoIdTable(table);
      } else {
        console.error(`  ${table}: ERROR — ${err.message}`);
      }
    }
  }
}

// Re-enable FK triggers
try {
  await destClient.query("SET session_replication_role = DEFAULT");
  console.log("\nFK checks re-enabled.");
} catch (_) {}

await Promise.all([srcClient.end(), destClient.end()]);
console.log("\nMigration complete.");
