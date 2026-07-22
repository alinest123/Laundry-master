import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { fabricsTable } from "@workspace/db";
import { requirePermission } from "../../middleware/requirePermission";
import { logAudit } from "../../lib/audit";

const router = Router();

router.get("/fabrics", requirePermission("fabrics", "view"), async (req, res): Promise<void> => {
  try {
    const rows = await db.select().from(fabricsTable).orderBy(desc(fabricsTable.createdAt));
    res.json(rows);
  } catch { res.status(500).json({ error: "Failed" }); }
});

router.get("/fabrics/:id", requirePermission("fabrics", "view"), async (req, res): Promise<void> => {
  try {
    const rows = await db.select().from(fabricsTable).where(eq(fabricsTable.id, parseInt(req.params.id as string))).limit(1);
    if (!rows[0]) { res.status(404).json({ error: "Not found" }); return; }
    res.json(rows[0]);
  } catch { res.status(500).json({ error: "Failed" }); }
});

router.post("/fabrics", requirePermission("fabrics", "create"), async (req, res): Promise<void> => {
  try {
    const { name, slug, description, careInstructions, properties, imageUrl } = req.body;
    const [row] = await db.insert(fabricsTable).values({ name, slug, description, careInstructions, properties, imageUrl }).returning();
    await logAudit(req, "create", "fabrics", row.id);
    res.status(201).json(row);
  } catch (err: any) {
    if (err?.code === "23505") res.status(409).json({ error: "Slug already exists" });
    else res.status(500).json({ error: "Failed to create fabric" });
  }
});

router.put("/fabrics/:id", requirePermission("fabrics", "edit"), async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    const { name, slug, description, careInstructions, properties, imageUrl } = req.body;
    const upd: Record<string, unknown> = {};
    if (name !== undefined) upd.name = name;
    if (slug !== undefined) upd.slug = slug;
    if (description !== undefined) upd.description = description;
    if (careInstructions !== undefined) upd.careInstructions = careInstructions;
    if (properties !== undefined) upd.properties = properties;
    if (imageUrl !== undefined) upd.imageUrl = imageUrl;
    const [row] = await db.update(fabricsTable).set(upd).where(eq(fabricsTable.id, id)).returning();
    await logAudit(req, "update", "fabrics", id);
    res.json(row);
  } catch { res.status(500).json({ error: "Failed to update fabric" }); }
});

router.delete("/fabrics/:id", requirePermission("fabrics", "delete"), async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    await db.delete(fabricsTable).where(eq(fabricsTable.id, id));
    await logAudit(req, "delete", "fabrics", id);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Failed to delete fabric" }); }
});

export default router;
