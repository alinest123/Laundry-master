import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { stainsTable } from "@workspace/db";
import { requirePermission } from "../../middleware/requirePermission";
import { logAudit } from "../../lib/audit";

const router = Router();

router.get("/stains", requirePermission("stains", "view"), async (req, res): Promise<void> => {
  try {
    const rows = await db.select().from(stainsTable).orderBy(desc(stainsTable.createdAt));
    res.json(rows);
  } catch { res.status(500).json({ error: "Failed" }); }
});

router.get("/stains/:id", requirePermission("stains", "view"), async (req, res): Promise<void> => {
  try {
    const rows = await db.select().from(stainsTable).where(eq(stainsTable.id, parseInt(req.params.id as string))).limit(1);
    if (!rows[0]) { res.status(404).json({ error: "Not found" }); return; }
    res.json(rows[0]);
  } catch { res.status(500).json({ error: "Failed" }); }
});

router.post("/stains", requirePermission("stains", "create"), async (req, res): Promise<void> => {
  try {
    const { name, slug, description, removalSteps, difficulty, fabricCompatibility } = req.body;
    const [row] = await db.insert(stainsTable).values({ name, slug, description, removalSteps, difficulty, fabricCompatibility }).returning();
    await logAudit(req, "create", "stains", row.id);
    res.status(201).json(row);
  } catch (err: any) {
    if (err?.code === "23505") res.status(409).json({ error: "Slug already exists" });
    else res.status(500).json({ error: "Failed to create stain" });
  }
});

router.put("/stains/:id", requirePermission("stains", "edit"), async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    const { name, slug, description, removalSteps, difficulty, fabricCompatibility } = req.body;
    const upd: Record<string, unknown> = {};
    if (name !== undefined) upd.name = name;
    if (slug !== undefined) upd.slug = slug;
    if (description !== undefined) upd.description = description;
    if (removalSteps !== undefined) upd.removalSteps = removalSteps;
    if (difficulty !== undefined) upd.difficulty = difficulty;
    if (fabricCompatibility !== undefined) upd.fabricCompatibility = fabricCompatibility;
    const [row] = await db.update(stainsTable).set(upd).where(eq(stainsTable.id, id)).returning();
    await logAudit(req, "update", "stains", id);
    res.json(row);
  } catch { res.status(500).json({ error: "Failed to update stain" }); }
});

router.delete("/stains/:id", requirePermission("stains", "delete"), async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    await db.delete(stainsTable).where(eq(stainsTable.id, id));
    await logAudit(req, "delete", "stains", id);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Failed to delete stain" }); }
});

export default router;
