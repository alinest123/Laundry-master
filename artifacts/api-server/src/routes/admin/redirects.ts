import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { redirectsTable } from "@workspace/db";
import { requirePermission } from "../../middleware/requirePermission";
import { logAudit } from "../../lib/audit";

const router = Router();

router.get("/redirects", requirePermission("redirects", "view"), async (req, res): Promise<void> => {
  try {
    const rows = await db.select().from(redirectsTable).orderBy(desc(redirectsTable.createdAt));
    res.json(rows);
  } catch { res.status(500).json({ error: "Failed" }); }
});

router.post("/redirects", requirePermission("redirects", "create"), async (req, res): Promise<void> => {
  try {
    const { fromPath, toPath, statusCode, isActive } = req.body;
    const [row] = await db.insert(redirectsTable).values({ fromPath, toPath, statusCode: statusCode ?? 301, isActive: isActive ?? true }).returning();
    await logAudit(req, "create", "redirects", row.id);
    res.status(201).json(row);
  } catch (err: any) {
    if (err?.code === "23505") res.status(409).json({ error: "From path already exists" });
    else res.status(500).json({ error: "Failed to create redirect" });
  }
});

router.put("/redirects/:id", requirePermission("redirects", "edit"), async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    const { fromPath, toPath, statusCode, isActive } = req.body;
    const upd: Record<string, unknown> = {};
    if (fromPath !== undefined) upd.fromPath = fromPath;
    if (toPath !== undefined) upd.toPath = toPath;
    if (statusCode !== undefined) upd.statusCode = statusCode;
    if (isActive !== undefined) upd.isActive = isActive;
    const [row] = await db.update(redirectsTable).set(upd).where(eq(redirectsTable.id, id)).returning();
    await logAudit(req, "update", "redirects", id);
    res.json(row);
  } catch { res.status(500).json({ error: "Failed to update redirect" }); }
});

router.delete("/redirects/:id", requirePermission("redirects", "delete"), async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    await db.delete(redirectsTable).where(eq(redirectsTable.id, id));
    await logAudit(req, "delete", "redirects", id);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Failed" }); }
});

export default router;
