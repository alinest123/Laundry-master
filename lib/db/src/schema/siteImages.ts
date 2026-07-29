import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";

export const siteImagesTable = pgTable("site_images", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  url: text("url").notNull().default(""),
  label: text("label").notNull(),
  section: text("section").notNull().default("General"),
  description: text("description"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type SiteImage = typeof siteImagesTable.$inferSelect;
