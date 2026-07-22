import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { auditLogsTable } from "@workspace/db";
import { requirePermission } from "../../middleware/requirePermission";

const router = Router();

router.get("/audit-logs", requirePermission("audit_logs", "view"), async (req, res): Promise<void> => {
  try {
    const { page = "1", limit = "50", resource, userId } = req.query as Record<string, string>;
    const p = Math.max(1, parseInt(page)), l = Math.min(200, parseInt(limit));
    let q = db.select().from(auditLogsTable).$dynamic();
    if (resource) q = q.where(eq(auditLogsTable.resource, resource));
    if (userId) q = q.where(eq(auditLogsTable.userId, parseInt(userId)));
    const rows = await q.orderBy(desc(auditLogsTable.createdAt)).limit(l).offset((p - 1) * l);
    res.json({ logs: rows, page: p, limit: l });
  } catch { res.status(500).json({ error: "Failed" }); }
});

export default router;
