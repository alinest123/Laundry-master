import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const redirectsTable = pgTable("redirects", {
  id: serial("id").primaryKey(),
  fromPath: text("from_path").notNull().unique(),
  toPath: text("to_path").notNull(),
  statusCode: integer("status_code").notNull().default(301), // 301 | 302
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertRedirectSchema = createInsertSchema(redirectsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRedirect = z.infer<typeof insertRedirectSchema>;
export type Redirect = typeof redirectsTable.$inferSelect;
