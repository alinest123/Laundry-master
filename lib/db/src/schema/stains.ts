import { pgTable, text, serial, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const stainDifficultyEnum = pgEnum("stain_difficulty", ["easy", "medium", "hard"]);

export const stainsTable = pgTable("stains", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  removalSteps: text("removal_steps"), // JSON string
  difficulty: stainDifficultyEnum("difficulty").notNull().default("medium"),
  fabricCompatibility: text("fabric_compatibility"), // JSON string
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertStainSchema = createInsertSchema(stainsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertStain = z.infer<typeof insertStainSchema>;
export type Stain = typeof stainsTable.$inferSelect;
