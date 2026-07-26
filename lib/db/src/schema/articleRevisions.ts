import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const articleRevisionsTable = pgTable("article_revisions", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  /** Full JSON snapshot of the article row at the time of save */
  snapshot: text("snapshot").notNull().default("{}"),
  savedBy: text("saved_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
