import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const mediaLibraryTable = pgTable("media_library", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  url: text("url").notNull(),
  size: integer("size").notNull().default(0), // bytes
  altText: text("alt_text"),
  uploadedBy: integer("uploaded_by"), // FK → users
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMediaLibrarySchema = createInsertSchema(mediaLibraryTable).omit({ id: true, createdAt: true });
export type InsertMediaLibrary = z.infer<typeof insertMediaLibrarySchema>;
export type MediaLibrary = typeof mediaLibraryTable.$inferSelect;
