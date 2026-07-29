import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

// Prefer Supabase when configured, fall back to Replit-provisioned DB.
const connectionString = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "No database URL found. Set SUPABASE_DATABASE_URL or provision a Replit database.",
  );
}

export const pool = new Pool({
  connectionString,
  // Supabase requires SSL in production; ignore cert errors in dev.
  ssl: process.env.SUPABASE_DATABASE_URL
    ? { rejectUnauthorized: false }
    : undefined,
});
export const db = drizzle(pool, { schema });

export * from "./schema";
