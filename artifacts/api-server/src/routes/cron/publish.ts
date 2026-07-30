import { Router, type Request, type Response } from "express";
import { publishDueArticles } from "../../lib/scheduler";
import { logger } from "../../lib/logger";

const router = Router();

/**
 * POST /cron/publish
 * Called by Vercel Cron every minute to auto-publish scheduled articles.
 *
 * ALWAYS requires Authorization: Bearer {CRON_SECRET}.
 * If CRON_SECRET is not configured, the endpoint returns 503 rather than
 * running unprotected — fail-secure.
 *
 * Vercel Cron automatically sends the header configured in vercel.json.
 * To test locally:
 *   curl -X POST /api/cron/publish -H "Authorization: Bearer <your-secret>"
 */
router.post("/cron/publish", async (req: Request, res: Response) => {
  const secret = process.env.CRON_SECRET?.trim();

  // Fail-secure: refuse to run if CRON_SECRET is not configured.
  if (!secret) {
    logger.warn("Cron: CRON_SECRET is not set — endpoint disabled for safety");
    res.status(503).json({ error: "Cron endpoint not configured (CRON_SECRET missing)" });
    return;
  }

  const auth = req.headers["authorization"] ?? "";
  const provided = auth.startsWith("Bearer ") ? auth.slice(7) : auth;
  if (provided !== secret) {
    logger.warn({ ip: req.ip }, "Cron: unauthorized request rejected");
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const result = await publishDueArticles();
    logger.info({ result }, "Cron: publish job complete");
    res.json({
      ok: true,
      published: result.count,
      ids: result.ids,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "Cron: publish job failed");
    res.status(500).json({ error: "Cron job failed" });
  }
});

export default router;
