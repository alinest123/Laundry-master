import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const fabricsTable = pgTable("fabrics", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  careInstructions: text("care_instructions"),
  properties: text("properties"), // JSON string
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertFabricSchema = createInsertSchema(fabricsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFabric = z.infer<typeof insertFabricSchema>;
export type Fabric = typeof fabricsTable.$inferSelect;
