import { pgTable, text, serial, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const securityEventEnum = pgEnum("security_event", [
  "login_failed", "unauthorized", "permission_denied", "brute_force"
]);

export const securityLogsTable = pgTable("security_logs", {
  id: serial("id").primaryKey(),
  event: securityEventEnum("event").notNull(),
  userId: integer("user_id"), // nullable
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  path: text("path"),
  detail: text("detail"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSecurityLogSchema = createInsertSchema(securityLogsTable).omit({ id: true, createdAt: true });
export type InsertSecurityLog = z.infer<typeof insertSecurityLogSchema>;
export type SecurityLog = typeof securityLogsTable.$inferSelect;
