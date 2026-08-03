/**
 * Public email helpers used by auth routes.
 * Delegates to the transactional transporter and branded templates.
 */

import { transactionalTransporter, TRANSACTIONAL_FROM } from "../services/email/transactional";
import { verifyEmailTemplate } from "../services/email/templates/verify-email";
import { passwordResetTemplate } from "../services/email/templates/password-reset";
import { welcomeTemplate } from "../services/email/templates/welcome";

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  await transactionalTransporter.sendMail({
    from: TRANSACTIONAL_FROM,
    to,
    subject: "Verify your email — Laundry Master",
    html: verifyEmailTemplate(token),
    text: `Verify your email by visiting:\n${process.env.SITE_URL ?? "https://laundry-master.com"}/verify-email?token=${encodeURIComponent(token)}\n\nExpires in 24 hours.`,
  });
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  await transactionalTransporter.sendMail({
    from: TRANSACTIONAL_FROM,
    to,
    subject: "Reset your password — Laundry Master",
    html: passwordResetTemplate(token),
    text: `Reset your password:\n${process.env.SITE_URL ?? "https://laundry-master.com"}/reset-password?token=${encodeURIComponent(token)}\n\nExpires in 1 hour.`,
  });
}

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  await transactionalTransporter.sendMail({
    from: TRANSACTIONAL_FROM,
    to,
    subject: "Welcome to Laundry Master",
    html: welcomeTemplate(name),
    text: `Welcome to Laundry Master, ${name}!\n\nYour account is now active. Visit ${process.env.SITE_URL ?? "https://laundry-master.com"} to get started.`,
  });
}
