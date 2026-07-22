import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const articleFaqsTable = pgTable("article_faqs", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id").notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertArticleFaqSchema = createInsertSchema(articleFaqsTable).omit({ id: true, createdAt: true });
export type InsertArticleFaq = z.infer<typeof insertArticleFaqSchema>;
export type ArticleFaq = typeof articleFaqsTable.$inferSelect;
