import { pgTable, integer, primaryKey } from "drizzle-orm/pg-core";

export const articleCategoriesTable = pgTable("article_categories", {
  articleId: integer("article_id").notNull(),
  categoryId: integer("category_id").notNull(),
}, (t) => [primaryKey({ columns: [t.articleId, t.categoryId] })]);
