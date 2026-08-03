/**
 * Cal.com webhook handler
 *
 * Registers at POST /api/webhooks/cal
 * Mounted with express.raw({ type: "application/json" }) so we receive the
 * raw body for HMAC-SHA256 signature verification.
 *
 * Required env var: CAL_WEBHOOK_SECRET — set in Cal.com Dashboard →
 *   Settings → Developer → Webhooks → Subscriber URL → Secret
 */

import { Router } from "express";
import crypto from "node:crypto";
import { db, appointmentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../../lib/logger";
import { sendConsultationBookedEmail } from "../../lib/email";

const router = Router();

// ── Signature verification ────────────────────────────────────────────────────

function verifySignature(rawBody: Buffer, signature: string | undefined): boolean {
  const secret = process.env.CAL_WEBHOOK_SECRET;
  if (!secret) {
    logger.warn("CAL_WEBHOOK_SECRET not set — skipping signature verification (dev mode only)");
    return true; // allow in dev; in production this will still warn but pass through
  }
  if (!signature) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  // Cal.com sends the raw hex (no "sha256=" prefix in some versions; handle both)
  const received = signature.startsWith("sha256=") ? signature.slice(7) : signature;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(received, "hex"));
  } catch {
    return false;
  }
}

// ── Status mapping ────────────────────────────────────────────────────────────

function mapStatus(triggerEvent: string, calStatus?: string): string {
  switch (triggerEvent) {
    case "BOOKING_CREATED":
      return calStatus === "PENDING" ? "pending" : "confirmed";
    case "BOOKING_RESCHEDULED":
      return "rescheduled";
    case "BOOKING_CANCELLED":
    case "BOOKING_REJECTED":
      return "cancelled";
    case "BOOKING_REQUESTED":
      return "pending";
    default:
      return "pending";
  }
}

// ── Extract appointment fields from Cal.com payload ───────────────────────────

function extractFields(payload: any, triggerEvent: string) {
  const attendee = Array.isArray(payload.attendees) ? payload.attendees[0] : null;
  const meetingUrl =
    payload.videoCallData?.url ??
    payload.metadata?.videoCallUrl ??
    null;

  const startTime = payload.startTime ? new Date(payload.startTime) : new Date();
  const endTime = payload.endTime ? new Date(payload.endTime) : null;
  const timezone = attendee?.timeZone ?? payload.organizer?.timeZone ?? "UTC";
  const notes =
    payload.description ??
    payload.additionalNotes ??
    (payload.responses?.notes?.value as string | undefined) ??
    null;

  return {
    calBookingUid: payload.uid as string,
    status: mapStatus(triggerEvent, payload.status),
    scheduledAt: startTime,
    scheduledEnd: endTime,
    timezone,
    userName: attendee?.name ?? payload.organizer?.name ?? "Unknown",
    userEmail: attendee?.email ?? payload.organizer?.email ?? "unknown@cal.com",
    zoomLink: meetingUrl,
    notes,
  };
}

// ── Webhook handler ───────────────────────────────────────────────────────────

router.post("/", async (req, res): Promise<void> => {
  const rawBody = req.body as Buffer;
  const signature = req.headers["x-cal-signature-256"] as string | undefined;

  if (!verifySignature(rawBody, signature)) {
    logger.warn("Cal.com webhook: invalid signature");
    res.status(401).json({ error: "Invalid signature" });
    return;
  }

  let event: any;
  try {
    event = JSON.parse(rawBody.toString("utf8"));
  } catch {
    res.status(400).json({ error: "Invalid JSON" });
    return;
  }

  const { triggerEvent, payload } = event;

  if (!triggerEvent || !payload) {
    // Ping / unknown event — acknowledge and move on
    res.json({ ok: true });
    return;
  }

  logger.info({ triggerEvent, uid: payload.uid }, "Cal.com webhook received");

  try {
    switch (triggerEvent) {
      case "BOOKING_CREATED":
      case "BOOKING_REQUESTED": {
        const fields = extractFields(payload, triggerEvent);
        // Upsert: if uid already exists (duplicate delivery), just update
        await db
          .insert(appointmentsTable)
          .values(fields)
          .onConflictDoUpdate({
            target: appointmentsTable.calBookingUid,
            set: {
              status: fields.status,
              scheduledAt: fields.scheduledAt,
              scheduledEnd: fields.scheduledEnd,
              timezone: fields.timezone,
              zoomLink: fields.zoomLink,
              notes: fields.notes,
              updatedAt: new Date(),
            },
          });
        logger.info({ uid: fields.calBookingUid }, "Cal.com booking created/upserted");

        // Send confirmation email to attendee (fire-and-forget)
        sendConsultationBookedEmail(fields.userEmail, {
          name: fields.userName,
          scheduledAt: fields.scheduledAt,
          timezone: fields.timezone,
          zoomLink: fields.zoomLink,
          notes: fields.notes,
        }).catch(err =>
          logger.error({ err, uid: fields.calBookingUid }, "Cal.com booking confirmation email failed"),
        );
        break;
      }

      case "BOOKING_RESCHEDULED": {
        const fields = extractFields(payload, triggerEvent);
        if (!fields.calBookingUid) break;
        await db
          .update(appointmentsTable)
          .set({
            status: "rescheduled",
            scheduledAt: fields.scheduledAt,
            scheduledEnd: fields.scheduledEnd,
            timezone: fields.timezone,
            zoomLink: fields.zoomLink,
            notes: fields.notes,
            updatedAt: new Date(),
          })
          .where(eq(appointmentsTable.calBookingUid, fields.calBookingUid));
        logger.info({ uid: fields.calBookingUid }, "Cal.com booking rescheduled");
        break;
      }

      case "BOOKING_CANCELLED":
      case "BOOKING_REJECTED": {
        const uid = payload.uid as string | undefined;
        if (!uid) break;
        await db
          .update(appointmentsTable)
          .set({ status: "cancelled", updatedAt: new Date() })
          .where(eq(appointmentsTable.calBookingUid, uid));
        logger.info({ uid }, "Cal.com booking cancelled");
        break;
      }

      case "BOOKING_NO_SHOW_UPDATED": {
        const uid = payload.uid as string | undefined;
        if (!uid) break;
        await db
          .update(appointmentsTable)
          .set({ status: "no-show", updatedAt: new Date() })
          .where(eq(appointmentsTable.calBookingUid, uid));
        logger.info({ uid }, "Cal.com booking marked no-show");
        break;
      }

      default:
        logger.info({ triggerEvent }, "Cal.com webhook: unhandled event (ignored)");
    }
  } catch (err) {
    logger.error({ err, triggerEvent, uid: payload?.uid }, "Cal.com webhook DB error");
    // Return 500 so Cal.com retries
    res.status(500).json({ error: "Internal error" });
    return;
  }

  res.json({ ok: true });
});

export default router;
