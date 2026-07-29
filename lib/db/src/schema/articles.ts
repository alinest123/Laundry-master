import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// content_type values: 60-second | professional-article | editorial | practical-guide |
//   technical-article | research-paper | white-paper | case-study | best-practice-guide |
//   sop | technical-reference | expert-interview | industry-heritage | professional-profile
// knowledge_level values: quick | professional | advanced
// difficulty values: beginner | intermediate | advanced
// expert_review_status values: not-reviewed | editorially-reviewed | expert-reviewed | technically-verified

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
  // Knowledge architecture
  contentType: text("content_type").notNull().default("professional-article"),
  knowledgeLevel: text("knowledge_level").notNull().default("professional"),
  difficulty: text("difficulty"),
  keyTakeaway: text("key_takeaway"),
  learningObjectives: text("learning_objectives"), // JSON array of strings
  expertReviewStatus: text("expert_review_status").notNull().default("not-reviewed"),
  // SEO
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  metaKeywords: text("meta_keywords"),
  canonicalUrl: text("canonical_url"),
  ogImage: text("og_image"),
  structuredData: text("structured_data"),
  noindex: boolean("noindex").notNull().default(false),
  nofollow: boolean("nofollow").notNull().default(false),
  // Extended SEO
  primaryKeyword: text("primary_keyword"),
  secondaryKeywords: text("secondary_keywords"), // comma-separated
  searchIntent: text("search_intent"), // informational | navigational | transactional | commercial
  targetAudience: text("target_audience"),
  featuredImageAlt: text("featured_image_alt"),
  ogImageAlt: text("og_image_alt"),
  // PDF attachment
  pdfUrl: text("pdf_url"),
  pdfTitle: text("pdf_title"),
  // Features
  tocEnabled: boolean("toc_enabled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertArticleSchema = createInsertSchema(articlesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type Article = typeof articlesTable.$inferSelect;
