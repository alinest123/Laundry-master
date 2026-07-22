import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const articleImagesTable = pgTable("article_images", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id").notNull(),
  url: text("url").notNull(),
  caption: text("caption"),
  altText: text("alt_text"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertArticleImageSchema = createInsertSchema(articleImagesTable).omit({ id: true, createdAt: true });
export type InsertArticleImage = z.infer<typeof insertArticleImageSchema>;
export type ArticleImage = typeof articleImagesTable.$inferSelect;
