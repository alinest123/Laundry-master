import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// stage values: start-here | build-understanding | go-deeper | apply-knowledge
export const learningPathItemsTable = pgTable("learning_path_items", {
  id: serial("id").primaryKey(),
  learningPathId: integer("learning_path_id").notNull(),
  articleId: integer("article_id").notNull(),
  stage: text("stage").notNull().default("build-understanding"),
  sortOrder: integer("sort_order").notNull().default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertLearningPathItemSchema = createInsertSchema(learningPathItemsTable).omit({ id: true, createdAt: true });
export type InsertLearningPathItem = z.infer<typeof insertLearningPathItemSchema>;
export type LearningPathItem = typeof learningPathItemsTable.$inferSelect;
