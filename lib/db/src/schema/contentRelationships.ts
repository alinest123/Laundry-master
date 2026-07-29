import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// relationship_type values:
//   related | prerequisite | follow-up | case-study | sop | reference | quick-to-professional | professional-to-technical
export const contentRelationshipsTable = pgTable("content_relationships", {
  id: serial("id").primaryKey(),
  sourceArticleId: integer("source_article_id").notNull(),
  targetArticleId: integer("target_article_id").notNull(),
  relationshipType: text("relationship_type").notNull().default("related"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertContentRelationshipSchema = createInsertSchema(contentRelationshipsTable).omit({ id: true, createdAt: true });
export type InsertContentRelationship = z.infer<typeof insertContentRelationshipSchema>;
export type ContentRelationship = typeof contentRelationshipsTable.$inferSelect;
