import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const zoomMeetingsTable = pgTable("zoom_meetings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  hostEmail: text("host_email").notNull(),
  joinUrl: text("join_url"),
  startTime: timestamp("start_time", { withTimezone: true }),
  duration: integer("duration").default(60), // minutes
  status: text("status").notNull().default("scheduled"), // scheduled | started | ended | cancelled
  relatedType: text("related_type"), // appointment | consultation
  relatedId: integer("related_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertZoomMeetingSchema = createInsertSchema(zoomMeetingsTable).omit({ id: true, createdAt: true });
export type InsertZoomMeeting = z.infer<typeof insertZoomMeetingSchema>;
export type ZoomMeeting = typeof zoomMeetingsTable.$inferSelect;
