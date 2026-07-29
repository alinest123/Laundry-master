import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const appointmentsTable = pgTable("appointments", {
  id: serial("id").primaryKey(),
  // Status: pending | confirmed | rescheduled | cancelled | no-show
  status: text("status").notNull().default("pending"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  scheduledEnd: timestamp("scheduled_end", { withTimezone: true }),
  timezone: text("timezone").notNull().default("UTC"),
  notes: text("notes"),
  // Meeting/video link (Zoom, Google Meet, etc.)
  zoomLink: text("zoom_link"),
  userEmail: text("user_email").notNull(),
  userName: text("user_name").notNull(),
  // Nullable: Cal.com bookings may not map to an internal service/expert
  serviceId: integer("service_id"),
  expertId: integer("expert_id"),
  // Cal.com integration
  calBookingUid: text("cal_booking_uid").unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertAppointmentSchema = createInsertSchema(appointmentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointmentsTable.$inferSelect;
