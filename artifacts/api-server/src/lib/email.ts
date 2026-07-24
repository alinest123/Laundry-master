import nodemailer from "nodemailer";

const FROM = process.env.EMAIL_FROM ?? "Laundry Master <noreply@laundrymaster.com>";
const SITE_URL = (process.env.SITE_URL ?? "").replace(/\/$/, "") || "https://laundrymaster.com";

function canSend(): boolean {
  return !!(process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS);
}

function makeTransport() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT ?? 587),
    secure: process.env.EMAIL_SECURE === "true",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
}

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const link = `${SITE_URL}/verify-email?token=${encodeURIComponent(token)}`;
  if (!canSend()) {
    console.log(`[EMAIL] Verification link for ${to}:\n  ${link}`);
    return;
  }
  await makeTransport().sendMail({
    from: FROM, to,
    subject: "Verify your email — Laundry Master",
    text: `Verify your email:\n${link}\n\nExpires in 24 hours.`,
    html: `<p>Hello,</p><p>Click the link below to verify your email address. It expires in 24 hours.</p><p><a href="${link}">${link}</a></p><p>If you didn't create an account, ignore this email.</p>`,
  });
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const link = `${SITE_URL}/reset-password?token=${encodeURIComponent(token)}`;
  if (!canSend()) {
    console.log(`[EMAIL] Password reset link for ${to}:\n  ${link}`);
    return;
  }
  await makeTransport().sendMail({
    from: FROM, to,
    subject: "Reset your password — Laundry Master",
    text: `Reset your password:\n${link}\n\nExpires in 1 hour.`,
    html: `<p>Hello,</p><p>Click the link below to reset your password. It expires in 1 hour.</p><p><a href="${link}">${link}</a></p><p>If you didn't request this, ignore this email.</p>`,
  });
}
