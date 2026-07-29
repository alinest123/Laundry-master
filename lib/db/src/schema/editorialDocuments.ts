import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// doc_type: editorial-identity | editorial-standards | publication-ethics |
//   copyright | privacy-policy | terms-of-use | disclaimer | ai-transparency | corrections
export const editorialDocumentsTable = pgTable("editorial_documents", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  docType: text("doc_type").notNull(),
  version: text("version").notNull().default("1.0"),
  effectiveDate: text("effective_date"),
  docNumber: text("doc_number"),
  status: text("status").notNull().default("active"), // draft | active | archived
  approvedBy: text("approved_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertEditorialDocumentSchema = createInsertSchema(editorialDocumentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEditorialDocument = z.infer<typeof insertEditorialDocumentSchema>;
export type EditorialDocument = typeof editorialDocumentsTable.$inferSelect;
