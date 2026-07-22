import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const paymentsTable = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"), // nullable FK → users
  amount: integer("amount").notNull(), // in cents
  currency: text("currency").notNull().default("usd"),
  status: text("status").notNull().default("pending"), // pending | succeeded | failed | refunded
  provider: text("provider").notNull().default("stripe"),
  providerRef: text("provider_ref"),
  description: text("description"),
  metadata: text("metadata"), // JSON string
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({ id: true, createdAt: true });
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof paymentsTable.$inferSelect;
