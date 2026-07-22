import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import bcrypt from "bcryptjs";
import * as schema from "./schema";

const { Pool } = pg;

async function seed() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL required");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
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
