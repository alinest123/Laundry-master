import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const articleCommentsTable = pgTable("article_comments", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id").notNull(),
  authorName: text("author_name").notNull(),
  authorEmail: text("author_email").notNull(),
  content: text("content").notNull(),
  /** 0 = pending, 1 = approved, -1 = rejected/disapproved */
  isApproved: integer("is_approved").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
