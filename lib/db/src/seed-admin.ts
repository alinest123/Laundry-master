import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import bcrypt from "bcryptjs";
import * as schema from "./schema";

const { Pool } = pg;

async function seed() {
  const url = process.env.SUPABASE_DATABASE_URL;
  if (!url) throw new Error("SUPABASE_DATABASE_URL is required.");

  // Parse robustly — Supabase passwords may contain '@'
  const noProto = url.replace(/^postgres(?:ql)?:\/\//, "");
  const lastAt = noProto.lastIndexOf("@");
  const creds = noProto.substring(0, lastAt);
  const hostPart = noProto.substring(lastAt + 1);
  const firstColon = creds.indexOf(":");
  const user = creds.substring(0, firstColon);
  const password = creds.substring(firstColon + 1);
  const slashIdx = hostPart.indexOf("/");
  const hostAndPort = slashIdx >= 0 ? hostPart.substring(0, slashIdx) : hostPart;
  const database = (slashIdx >= 0 ? hostPart.substring(slashIdx + 1) : "postgres").split("?")[0] || "postgres";
  const colonIdx = hostAndPort.lastIndexOf(":");
  const host = colonIdx >= 0 ? hostAndPort.substring(0, colonIdx) : hostAndPort;
  const port = colonIdx >= 0 ? parseInt(hostAndPort.substring(colonIdx + 1), 10) : 5432;

  const pool = new Pool({ host, port, user, password, database, ssl: { rejectUnauthorized: false } });
  const db = drizzle(pool, { schema });

  const existing = await db.select({ id: schema.usersTable.id }).from(schema.usersTable).limit(1);
  if (existing.length > 0) {
    console.log("✓ Users already exist — skipping seed");
    await pool.end();
    return;
  }

  const passwordHash = await bcrypt.hash("changeme123", 12);
  await db.insert(schema.usersTable).values({
    name: "Super Admin",
    email: "admin@laundrymaster.com",
    passwordHash,
    role: "super_admin",
    isActive: true,
  });

  console.log("✓ Super Admin seeded: admin@laundrymaster.com / changeme123");
  console.log("  ⚠️  Change the password immediately after first login!");
  await pool.end();
}

seed().catch((err) => { console.error(err); process.exit(1); });
