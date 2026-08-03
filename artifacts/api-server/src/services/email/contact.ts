/**
 * Contact form email transporter
 *
 * Used for: website Contact Us form, general enquiries,
 * partnership requests, business enquiries.
 *
 * Credentials read from env vars:
 *   CONTACT_SMTP_HOST, CONTACT_SMTP_PORT, CONTACT_SMTP_SECURE,
 *   CONTACT_SMTP_USER, CONTACT_SMTP_PASS, CONTACT_FROM, CONTACT_TO
 */

import nodemailer, { Transporter } from "nodemailer";
import { logger } from "../../lib/logger";
import { contactReceivedTemplate } from "./templates/contact-received";

const CONTACT_FROM =
  process.env.CONTACT_FROM ?? "Laundry Master Contact <contactus@laundry-master.com>";

const CONTACT_TO =
  process.env.CONTACT_TO ?? "contactus@laundry-master.com";

function isConfigured(): boolean {
  return !!(
    process.env.CONTACT_SMTP_HOST &&
    process.env.CONTACT_SMTP_USER &&
    process.env.CONTACT_SMTP_PASS
  );
}

function buildTransporter(): Transporter {
  return nodemailer.createTransport({
    host: process.env.CONTACT_SMTP_HOST,
    port: Number(process.env.CONTACT_SMTP_PORT ?? 465),
    secure: process.env.CONTACT_SMTP_SECURE !== "false", // default true
    auth: {
      user: process.env.CONTACT_SMTP_USER,
      pass: process.env.CONTACT_SMTP_PASS,
    },
  });
}

let _transporter: Transporter | null = null;

function getContactTransporter(): Transporter {
  if (!_transporter) _transporter = buildTransporter();
  return _transporter;
}

/** Named export matching the spec */
export const contactTransporter = {
  async sendMail(options: nodemailer.SendMailOptions): Promise<void> {
    if (!isConfigured()) {
      logger.warn(
        { to: options.to, subject: options.subject },
        "[contact] SMTP not configured — email suppressed (dev mode)",
      );
      return;
    }
    const attempt = async () => getContactTransporter().sendMail(options);
    try {
      await attempt();
      logger.info({ to: options.to, subject: options.subject }, "[contact] sent");
    } catch (err) {
      logger.warn({ err }, "[contact] first attempt failed, retrying once");
      try {
        _transporter = buildTransporter();
        await attempt();
        logger.info({ to: options.to, subject: options.subject }, "[contact] sent (retry)");
      } catch (retryErr) {
        logger.error({ err: retryErr, to: options.to, subject: options.subject }, "[contact] send failed");
        throw retryErr;
      }
    }
  },
};

export interface ContactEnquiry {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  country?: string;
  subject: string;
  message: string;
  ip?: string;
}

/**
 * 1. Sends the full enquiry to the internal mailbox (contactus@...)
 * 2. Sends an auto-acknowledgement to the visitor
 */
export async function sendContactEnquiry(data: ContactEnquiry): Promise<void> {
  const now = new Date().toLocaleString("en-GB", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "UTC",
  });

  // ── 1. Internal notification ─────────────────────────────────────────────
  const internalHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="font-family:Arial,sans-serif;font-size:14px;color:#333;max-width:600px;margin:0 auto;padding:24px;">
  <div style="border-left:4px solid #1a2e1a;padding-left:16px;margin-bottom:24px;">
    <h2 style="margin:0;color:#1a2e1a;font-size:18px;">New Contact Form Enquiry</h2>
    <p style="margin:4px 0 0;color:#666;font-size:13px;">${now} UTC</p>
  </div>
  <table style="width:100%;border-collapse:collapse;font-size:14px;">
    <tr><td style="padding:8px 0;font-weight:bold;color:#555;width:120px;">Name</td><td style="padding:8px 0;">${esc(data.name)}</td></tr>
    <tr><td style="padding:8px 0;font-weight:bold;color:#555;">Email</td><td style="padding:8px 0;"><a href="mailto:${esc(data.email)}">${esc(data.email)}</a></td></tr>
    ${data.company ? `<tr><td style="padding:8px 0;font-weight:bold;color:#555;">Company</td><td style="padding:8px 0;">${esc(data.company)}</td></tr>` : ""}
    ${data.phone ? `<tr><td style="padding:8px 0;font-weight:bold;color:#555;">Phone</td><td style="padding:8px 0;">${esc(data.phone)}</td></tr>` : ""}
    ${data.country ? `<tr><td style="padding:8px 0;font-weight:bold;color:#555;">Country</td><td style="padding:8px 0;">${esc(data.country)}</td></tr>` : ""}
    <tr><td style="padding:8px 0;font-weight:bold;color:#555;">Subject</td><td style="padding:8px 0;">${esc(data.subject)}</td></tr>
    ${data.ip ? `<tr><td style="padding:8px 0;font-weight:bold;color:#555;">IP</td><td style="padding:8px 0;font-family:monospace;">${esc(data.ip)}</td></tr>` : ""}
  </table>
  <div style="margin-top:20px;padding:16px;background:#f9f9f9;border:1px solid #e8e8e8;border-radius:6px;">
    <p style="margin:0 0 8px;font-weight:bold;color:#555;">Message</p>
    <p style="margin:0;white-space:pre-wrap;line-height:1.6;">${esc(data.message)}</p>
  </div>
</body>
</html>`;

  await contactTransporter.sendMail({
    from: CONTACT_FROM,
    to: CONTACT_TO,
    replyTo: data.email,
    subject: `[Contact Form] ${data.subject} — ${data.name}`,
    html: internalHtml,
    text: `New enquiry from ${data.name} <${data.email}>\n\nSubject: ${data.subject}\n\nMessage:\n${data.message}\n\n---\nReceived: ${now} UTC${data.ip ? `\nIP: ${data.ip}` : ""}`,
  });

  // ── 2. Auto-acknowledgement to visitor ───────────────────────────────────
  await contactTransporter.sendMail({
    from: CONTACT_FROM,
    to: data.email,
    subject: "We've received your enquiry — Laundry Master",
    html: contactReceivedTemplate(data.name),
    text: `Hello ${data.name},\n\nThank you for contacting Laundry Master.\n\nWe have received your enquiry and our team will review it shortly.\n\nIf your enquiry is urgent, please mention it in your reply.\n\nRegards,\nLaundry Master Team`,
  });
}

/** Escape HTML special characters to prevent XSS in the internal email */
function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Called on server startup to verify credentials */
export async function verifyContactConnection(): Promise<void> {
  if (!isConfigured()) {
    logger.warn("[contact] CONTACT_SMTP_HOST/USER/PASS not set — contact email disabled");
    return;
  }
  try {
    await getContactTransporter().verify();
    logger.info("[contact] SMTP connection verified ✓");
  } catch (err) {
    logger.error({ err }, "[contact] SMTP connection failed — check CONTACT_SMTP_* env vars");
  }
}
