import { Router } from "express";
import { eq, inArray, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { newsletterSubscribersTable } from "@workspace/db";
import { requirePermission } from "../../middleware/requirePermission";
import { logAudit } from "../../lib/audit";

const router = Router();

router.get("/newsletter", requirePermission("newsletter", "view"), async (req, res): Promise<void> => {
  try {
    const { page = "1", limit = "50" } = req.query as Record<string, string>;
    const p = Math.max(1, parseInt(page)), l = Math.min(200, parseInt(limit));
    const rows = await db.select().from(newsletterSubscribersTable)
      .orderBy(desc(newsletterSubscribersTable.subscribedAt)).limit(l).offset((p - 1) * l);
    res.json({ subscribers: rows, page: p, limit: l });
  } catch { res.status(500).json({ error: "Failed" }); }
});

router.delete("/newsletter/:id", requirePermission("newsletter", "delete"), async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    await db.delete(newsletterSubscribersTable).where(eq(newsletterSubscribersTable.id, id));
    await logAudit(req, "delete", "newsletter", id);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Failed" }); }
});

router.post("/newsletter/bulk-delete", requirePermission("newsletter", "delete"), async (req, res): Promise<void> => {
  try {
    const { ids } = req.body as { ids: number[] };
    if (!ids?.length) { res.status(400).json({ error: "ids required" }); return; }
    await db.delete(newsletterSubscribersTable).where(inArray(newsletterSubscribersTable.id, ids));
    await logAudit(req, "bulk_delete", "newsletter", null, { count: ids.length });
    res.json({ ok: true, deleted: ids.length });
  } catch { res.status(500).json({ error: "Failed" }); }
});

export default router;
