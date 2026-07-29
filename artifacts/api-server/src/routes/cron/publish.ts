import { Router, type Request, type Response } from "express";
import { publishDueArticles } from "../../lib/scheduler";
import { logger } from "../../lib/logger";

const router = Router();

/**
 * POST /cron/publish
 * Called by Vercel Cron every minute to auto-publish scheduled articles.
 * Protected by CRON_SECRET header check.
 *
 * Vercel Cron sends: Authorization: Bearer {CRON_SECRET}
 */
router.post("/cron/publish", async (req: Request, res: Response) => {
  const secret = process.env.CRON_SECRET?.trim();

  if (secret) {
    const auth = req.headers["authorization"] ?? "";
    const provided = auth.startsWith("Bearer ") ? auth.slice(7) : auth;
    if (provided !== secret) {
      logger.warn({ ip: req.ip }, "Cron: unauthorized request rejected");
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
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
