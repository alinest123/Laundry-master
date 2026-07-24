import { pgTable, serial, integer, timestamp, unique } from "drizzle-orm/pg-core";

export const savedArticlesTable = pgTable("saved_articles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),      // → users.id
  articleId: integer("article_id").notNull(), // → articles.id
  savedAt: timestamp("saved_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [unique().on(t.userId, t.articleId)]);

export type SavedArticle = typeof savedArticlesTable.$inferSelect;
