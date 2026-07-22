import { pgTable, integer, primaryKey } from "drizzle-orm/pg-core";

export const articleTagsTable = pgTable("article_tags", {
  articleId: integer("article_id").notNull(),
  tagId: integer("tag_id").notNull(),
}, (t) => [primaryKey({ columns: [t.articleId, t.tagId] })]);
