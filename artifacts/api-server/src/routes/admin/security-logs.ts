import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { securityLogsTable } from "@workspace/db";
import { requirePermission } from "../../middleware/requirePermission";

const router = Router();

router.get("/security-logs", requirePermission("security_logs", "view"), async (req, res): Promise<void> => {
  try {
    const { page = "1", limit = "50", event } = req.query as Record<string, string>;
    const p = Math.max(1, parseInt(page)), l = Math.min(200, parseInt(limit));
    let q = db.select().from(securityLogsTable).$dynamic();
    if (event) q = q.where(eq(securityLogsTable.event, event as any));
    const rows = await q.orderBy(desc(securityLogsTable.createdAt)).limit(l).offset((p - 1) * l);
    res.json({ logs: rows, page: p, limit: l });
  } catch { res.status(500).json({ error: "Failed" }); }
});

export default router;
