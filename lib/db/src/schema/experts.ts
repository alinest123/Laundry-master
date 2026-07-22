import { pgTable, text, serial, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const expertsTable = pgTable("experts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  title: text("title").notNull(),
  bio: text("bio").notNull(),
  avatar: text("avatar"),
  specializations: text("specializations").array().notNull().default([]),
  rating: numeric("rating", { precision: 3, scale: 1 }).notNull().default("4.8"),
  sessionCount: integer("session_count").notNull().default(0),
  yearsExperience: integer("years_experience").notNull().default(10),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertExpertSchema = createInsertSchema(expertsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertExpert = z.infer<typeof insertExpertSchema>;
export type Expert = typeof expertsTable.$inferSelect;
