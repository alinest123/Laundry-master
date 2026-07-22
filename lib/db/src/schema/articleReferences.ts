import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Covers references, citations, and external sources
export const articleReferencesTable = pgTable("article_references", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id").notNull(),
  title: text("title").notNull(),
  url: text("url"),
  description: text("description"),
  refType: text("ref_type").notNull().default("reference"), // reference | citation | external
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertArticleReferenceSchema = createInsertSchema(articleReferencesTable).omit({ id: true, createdAt: true });
export type InsertArticleReference = z.infer<typeof insertArticleReferenceSchema>;
export type ArticleReference = typeof articleReferencesTable.$inferSelect;
