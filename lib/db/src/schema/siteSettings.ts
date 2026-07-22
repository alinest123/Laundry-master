import { pgTable, text, serial, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const siteSettingsTable = pgTable("site_settings", {
  id: serial("id").primaryKey(), // always 1
  siteName: text("site_name").notNull().default("The Science of Professional Textile Care"),
  siteDescription: text("site_description"),
  contactEmail: text("contact_email"),
  maintenanceMode: boolean("maintenance_mode").notNull().default(false),
  customHeadHtml: text("custom_head_html"),
  customBodyHtml: text("custom_body_html"),
  socialLinks: text("social_links"), // JSON string
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSiteSettingsSchema = createInsertSchema(siteSettingsTable).omit({ id: true, updatedAt: true });
export type InsertSiteSettings = z.infer<typeof insertSiteSettingsSchema>;
export type SiteSettings = typeof siteSettingsTable.$inferSelect;
