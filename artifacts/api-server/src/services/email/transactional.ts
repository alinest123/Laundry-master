/**
 * Transactional email transporter
 *
 * Used for: email verification, password reset, welcome, membership
 * confirmation, consultation confirmation, AI support notifications,
 * security notifications.
 *
 * Credentials read from env vars:
 *   SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM
 */

import nodemailer, { Transporter } from "nodemailer";
import { logger } from "../../lib/logger";

export const TRANSACTIONAL_FROM =
  process.env.SMTP_FROM ?? "Laundry Master <donotreply@laundry-master.com>";

function isConfigured(): boolean {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
}

function buildTransporter(): Transporter {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: process.env.SMTP_SECURE !== "false", // default true
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/** Lazily-created singleton — recreated if env vars change at runtime */
let _transporter: Transporter | null = null;

export function getTransactionalTransporter(): Transporter {
  if (!_transporter) _transporter = buildTransporter();
  return _transporter;
}

/** Named export matching the spec */
export const transactionalTransporter = {
  /** Send mail with one automatic retry on failure */
  async sendMail(options: nodemailer.SendMailOptions): Promise<void> {
    if (!isConfigured()) {
      logger.warn(
        { to: options.to, subject: options.subject },
        "[transactional] SMTP not configured — email suppressed (dev mode)",
      );
      return;
    }
    const attempt = async () => getTransactionalTransporter().sendMail(options);
    try {
      await attempt();
      logger.info({ to: options.to, subject: options.subject }, "[transactional] sent");
    } catch (err) {
      logger.warn({ err }, "[transactional] first attempt failed, retrying once");
      try {
        // Force a fresh transporter on retry
        _transporter = buildTransporter();
        await attempt();
        logger.info({ to: options.to, subject: options.subject }, "[transactional] sent (retry)");
      } catch (retryErr) {
        logger.error({ err: retryErr, to: options.to, subject: options.subject }, "[transactional] send failed");
        throw retryErr;
      }
    }
  },
};

/** Called on server startup to verify credentials */
export async function verifyTransactionalConnection(): Promise<void> {
  if (!isConfigured()) {
    logger.warn("[transactional] SMTP_HOST/SMTP_USER/SMTP_PASS not set — email disabled");
    return;
  }
  try {
    await getTransactionalTransporter().verify();
    logger.info("[transactional] SMTP connection verified ✓");
  } catch (err) {
    logger.error({ err }, "[transactional] SMTP connection failed — check SMTP_* env vars");
  }
}
