import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { paymentsTable } from "@workspace/db";
import { requirePermission } from "../../middleware/requirePermission";

const router = Router();

router.get("/payments", requirePermission("payments", "view"), async (req, res): Promise<void> => {
  try {
    const { page = "1", limit = "20", status } = req.query as Record<string, string>;
    const p = Math.max(1, parseInt(page)), l = Math.min(100, parseInt(limit));
    let q = db.select().from(paymentsTable).$dynamic();
    if (status) q = q.where(eq(paymentsTable.status, status));
    const rows = await q.orderBy(desc(paymentsTable.createdAt)).limit(l).offset((p - 1) * l);
    res.json({ payments: rows, page: p, limit: l });
  } catch { res.status(500).json({ error: "Failed" }); }
});

router.get("/payments/:id", requirePermission("payments", "view"), async (req, res): Promise<void> => {
  try {
    const rows = await db.select().from(paymentsTable).where(eq(paymentsTable.id, parseInt(req.params.id as string))).limit(1);
    if (!rows[0]) { res.status(404).json({ error: "Not found" }); return; }
    res.json(rows[0]);
  } catch { res.status(500).json({ error: "Failed" }); }
});

export default router;
