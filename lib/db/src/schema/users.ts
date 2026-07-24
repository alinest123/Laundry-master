import { pgTable, text, serial, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userRoleEnum = pgEnum("user_role", [
  "super_admin", "administrator", "editor", "author", "consultant", "user"
]);

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("user"),
  isActive: boolean("is_active").notNull().default(true),

  // Email verification — default true keeps existing admin accounts working after migration
  emailVerified: boolean("email_verified").notNull().default(true),
  emailVerificationToken: text("email_verification_token"),
  verificationTokenExpiry: timestamp("verification_token_expiry", { withTimezone: true }),

  // Password reset
  passwordResetToken: text("password_reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry", { withTimezone: true }),

  // Extended profile
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  phone: text("phone"),

  // Newsletter preferences
  newsletterEnabled: boolean("newsletter_enabled").notNull().default(true),
  newsletterTopics: text("newsletter_topics").default("[]"), // JSON array string

  // 2FA — schema reserved for future implementation
  twoFaEnabled: boolean("two_fa_enabled").notNull().default(false),
  twoFaSecret: text("two_fa_secret"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
