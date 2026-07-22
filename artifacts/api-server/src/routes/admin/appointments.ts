import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { appointmentsTable } from "@workspace/db";
import { requirePermission } from "../../middleware/requirePermission";
import { logAudit } from "../../lib/audit";

const router = Router();

router.get("/appointments", requirePermission("appointments", "view"), async (req, res): Promise<void> => {
  try {
    const { page = "1", limit = "20", status } = req.query as Record<string, string>;
    const p = Math.max(1, parseInt(page)), l = Math.min(100, parseInt(limit));
    let q = db.select().from(appointmentsTable).$dynamic();
    if (status) q = q.where(eq(appointmentsTable.status, status));
    const rows = await q.orderBy(desc(appointmentsTable.scheduledAt)).limit(l).offset((p - 1) * l);
    res.json({ appointments: rows, page: p, limit: l });
  } catch { res.status(500).json({ error: "Failed" }); }
});

router.patch("/appointments/:id", requirePermission("appointments", "edit"), async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    const { status, notes, zoomLink } = req.body;
    const upd: Record<string, unknown> = {};
    if (status !== undefined) upd.status = status;
    if (notes !== undefined) upd.notes = notes;
    if (zoomLink !== undefined) upd.zoomLink = zoomLink;
    const [row] = await db.update(appointmentsTable).set(upd).where(eq(appointmentsTable.id, id)).returning();
    await logAudit(req, "update", "appointments", id, upd);
    res.json(row);
  } catch { res.status(500).json({ error: "Failed to update appointment" }); }
});

export default router;
