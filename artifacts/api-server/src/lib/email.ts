/**
 * Public email helpers — delegates to the transactional transporter
 * and branded templates.
 *
 * Every function fires-and-forgets errors (logged only) so callers are
 * never blocked by a temporary SMTP outage.
 */

import { transactionalTransporter, TRANSACTIONAL_FROM } from "../services/email/transactional";
import { verifyEmailTemplate }          from "../services/email/templates/verify-email";
import { passwordResetTemplate }        from "../services/email/templates/password-reset";
import { welcomeTemplate }             from "../services/email/templates/welcome";
import { consultationBookedTemplate }  from "../services/email/templates/consultation-booked";
import { membershipConfirmationTemplate } from "../services/email/templates/membership-confirmation";
import { supportTicketTemplate }       from "../services/email/templates/support-ticket";
import { securityAlertTemplate, SecurityEvent } from "../services/email/templates/security-alert";

const SITE = (process.env.SITE_URL ?? "https://laundry-master.com").replace(/\/$/, "");

// ── Auth emails ───────────────────────────────────────────────────────────────

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  await transactionalTransporter.sendMail({
    from: TRANSACTIONAL_FROM,
    to,
    subject: "Verify your email — Laundry Master",
    html: verifyEmailTemplate(token),
    text: `Verify your email:\n${SITE}/verify-email?token=${encodeURIComponent(token)}\n\nExpires in 24 hours.`,
  });
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  await transactionalTransporter.sendMail({
    from: TRANSACTIONAL_FROM,
    to,
    subject: "Reset your password — Laundry Master",
    html: passwordResetTemplate(token),
    text: `Reset your password:\n${SITE}/reset-password?token=${encodeURIComponent(token)}\n\nExpires in 1 hour.`,
  });
}

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  await transactionalTransporter.sendMail({
    from: TRANSACTIONAL_FROM,
    to,
    subject: "Welcome to Laundry Master",
    html: welcomeTemplate(name),
    text: `Welcome to Laundry Master, ${name}!\n\nYour account is now active. Visit ${SITE} to get started.`,
  });
}

// ── Consultation ──────────────────────────────────────────────────────────────

interface ConsultationDetails {
  name: string;
  scheduledAt: Date;
  timezone: string;
  zoomLink?: string | null;
  notes?: string | null;
}

export async function sendConsultationBookedEmail(
  to: string,
  data: ConsultationDetails,
): Promise<void> {
  const dateStr = data.scheduledAt.toLocaleString("en-GB", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: data.timezone,
  });
  await transactionalTransporter.sendMail({
    from: TRANSACTIONAL_FROM,
    to,
    subject: "Your consultation is confirmed — Laundry Master",
    html: consultationBookedTemplate(data),
    text: [
      `Hello ${data.name}, your consultation is confirmed.`,
      `Date & Time: ${dateStr} (${data.timezone})`,
      data.zoomLink ? `Join: ${data.zoomLink}` : "",
      data.notes ? `Notes: ${data.notes}` : "",
      `Dashboard: ${SITE}/dashboard`,
    ].filter(Boolean).join("\n"),
  });
}

// ── Membership ────────────────────────────────────────────────────────────────

interface MembershipDetails {
  name: string;
  plan: string;
  validUntil?: Date | null;
}

export async function sendMembershipConfirmationEmail(
  to: string,
  data: MembershipDetails,
): Promise<void> {
  await transactionalTransporter.sendMail({
    from: TRANSACTIONAL_FROM,
    to,
    subject: "Your Laundry Master membership is active",
    html: membershipConfirmationTemplate(data),
    text: [
      `Hello ${data.name}, your Laundry Master membership is now active.`,
      `Plan: ${data.plan}`,
      data.validUntil ? `Valid until: ${data.validUntil.toLocaleDateString("en-GB")}` : "",
      `Dashboard: ${SITE}/dashboard`,
    ].filter(Boolean).join("\n"),
  });
}

// ── Support tickets ───────────────────────────────────────────────────────────

interface SupportTicketDetails {
  name: string;
  subject: string;
  ticketRef: string;
  message: string;
}

export async function sendSupportTicketEmail(
  to: string,
  data: SupportTicketDetails,
): Promise<void> {
  await transactionalTransporter.sendMail({
    from: TRANSACTIONAL_FROM,
    to,
    subject: `Support request received [${data.ticketRef}] — Laundry Master`,
    html: supportTicketTemplate(data),
    text: [
      `Hello ${data.name}, we received your support request.`,
      `Reference: ${data.ticketRef}`,
      `Subject: ${data.subject}`,
      `Message: ${data.message}`,
      `Dashboard: ${SITE}/dashboard`,
    ].join("\n"),
  });
}

// ── Security notifications ────────────────────────────────────────────────────

interface SecurityAlertContext {
  name: string;
  ipAddress?: string | null;
  timestamp?: string | null;
}

export async function sendSecurityAlertEmail(
  to: string,
  event: SecurityEvent,
  ctx: SecurityAlertContext,
): Promise<void> {
  const subjects: Record<SecurityEvent, string> = {
    password_changed:         "Your Laundry Master password was changed",
    password_reset_requested: "Password reset requested — Laundry Master",
    failed_login_attempts:    "Security alert — suspicious activity on your account",
    new_login:                "New sign-in to your Laundry Master account",
  };
  await transactionalTransporter.sendMail({
    from: TRANSACTIONAL_FROM,
    to,
    subject: subjects[event],
    html: securityAlertTemplate(event, ctx),
    text: `Security notification for your Laundry Master account: ${subjects[event]}. If you did not perform this action, reset your password at ${SITE}/forgot-password`,
  });
}
