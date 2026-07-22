import { pgTable, integer, primaryKey } from "drizzle-orm/pg-core";

export const articleRelatedTable = pgTable("article_related", {
  articleId: integer("article_id").notNull(),
  relatedArticleId: integer("related_article_id").notNull(),
}, (t) => [primaryKey({ columns: [t.articleId, t.relatedArticleId] })]);
