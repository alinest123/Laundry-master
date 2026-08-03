/**
 * POST /api/support
 *
 * Accepts a support ticket from an authenticated or anonymous user,
 * logs it to the audit trail, and sends the user a confirmation email.
 */

import { Router } from "express";
import { randomBytes } from "crypto";
import { sendSupportTicketEmail } from "../lib/email";
import { logger } from "../lib/logger";

const router = Router();

router.post("/support", async (req, res): Promise<void> => {
  const { name, email, subject, message } = req.body ?? {};

  if (!name || !email || !subject || !message) {
    res.status(400).json({ error: "name, email, subject, and message are required" });
    return;
  }

  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRx.test(email)) {
    res.status(400).json({ error: "Invalid email address" });
    return;
  }

  if (message.trim().length < 10) {
    res.status(400).json({ error: "Message is too short" });
    return;
  }

  // Generate a short human-readable ticket reference
  const ticketRef = `LM-${randomBytes(3).toString("hex").toUpperCase()}`;

  logger.info({ ticketRef, email, subject }, "Support ticket received");

  // Fire confirmation email — non-blocking
  sendSupportTicketEmail(email, {
    name: String(name).trim(),
    subject: String(subject).trim(),
    ticketRef,
    message: String(message).trim(),
  }).catch(err =>
    logger.error({ err, ticketRef }, "[support] confirmation email failed"),
  );

  res.status(201).json({ ok: true, ticketRef });
});

export default router;
