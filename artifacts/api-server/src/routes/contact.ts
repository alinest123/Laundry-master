/**
 * POST /api/contact
 *
 * Handles the public Contact Us form submission.
 * 1. Sends the enquiry to the internal mailbox (contactus@laundry-master.com)
 * 2. Sends an auto-acknowledgement to the visitor
 */

import { Router } from "express";
import { sendContactEnquiry } from "../services/email/contact";
import { logger } from "../lib/logger";

const router = Router();

router.post("/contact", async (req, res): Promise<void> => {
  const { name, email, company, phone, country, subject, message } = req.body ?? {};

  if (!name?.trim()) { res.status(400).json({ error: "Name is required" }); return; }
  if (!email?.trim()) { res.status(400).json({ error: "Email is required" }); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "Valid email is required" }); return;
  }
  if (!subject?.trim()) { res.status(400).json({ error: "Subject is required" }); return; }
  if (!message?.trim()) { res.status(400).json({ error: "Message is required" }); return; }
  if (message.trim().length < 10) {
    res.status(400).json({ error: "Message is too short" }); return;
  }

  // Best-effort IP extraction (works behind proxies when trust proxy is set)
  const ip =
    (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    undefined;

  try {
    await sendContactEnquiry({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      company: company?.trim() || undefined,
      phone: phone?.trim() || undefined,
      country: country?.trim() || undefined,
      subject: subject.trim(),
      message: message.trim(),
      ip,
    });
    res.json({ ok: true, message: "Your enquiry has been received. We'll be in touch shortly." });
  } catch (err) {
    logger.error({ err }, "Contact form email failed");
    res.status(500).json({ error: "Failed to send your enquiry. Please try again or email us directly." });
  }
});

export default router;
