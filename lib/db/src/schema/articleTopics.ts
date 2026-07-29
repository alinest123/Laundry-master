import { pgTable, integer, primaryKey } from "drizzle-orm/pg-core";

export const articleTopicsTable = pgTable("article_topics", {
  articleId: integer("article_id").notNull(),
  topicId: integer("topic_id").notNull(),
}, (t) => [primaryKey({ columns: [t.articleId, t.topicId] })]);
