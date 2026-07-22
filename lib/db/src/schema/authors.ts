import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const authorsTable = pgTable("authors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  bio: text("bio"),
  avatar: text("avatar"),
  role: text("role").notNull().default("Author"),
  articleCount: integer("article_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertAuthorSchema = createInsertSchema(authorsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAuthor = z.infer<typeof insertAuthorSchema>;
export type Author = typeof authorsTable.$inferSelect;
