import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const articlesTable = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull().default(""),
  featuredImage: text("featured_image"),
  readingTime: integer("reading_time").notNull().default(5),
  views: integer("views").notNull().default(0),
  status: text("status").notNull().default("draft"), // draft | published | scheduled | archived
  authorId: integer("author_id").notNull(),
  isFeatured: integer("is_featured").notNull().default(0),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  // SEO
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  metaKeywords: text("meta_keywords"),
  canonicalUrl: text("canonical_url"),
  ogImage: text("og_image"),
  structuredData: text("structured_data"),
  noindex: boolean("noindex").notNull().default(false),
  nofollow: boolean("nofollow").notNull().default(false),
  // Features
  tocEnabled: boolean("toc_enabled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertArticleSchema = createInsertSchema(articlesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type Article = typeof articlesTable.$inferSelect;
