import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { tagsTable } from "@workspace/db";
import { requirePermission } from "../../middleware/requirePermission";

const router = Router();

router.get("/admin/tags", requirePermission("tags", "view"), async (req, res): Promise<void> => {
  try {
    const rows = await db.select().from(tagsTable).orderBy(tagsTable.name);
    res.json(rows);
  } catch { res.status(500).json({ error: "Failed to list tags" }); }
});

router.post("/admin/tags", requirePermission("tags", "create"), async (req, res): Promise<void> => {
  try {
    const { name, slug } = req.body;
    const [tag] = await db.insert(tagsTable).values({ name, slug }).returning();
    res.status(201).json(tag);
  } catch (err: any) {
    if (err?.code === "23505") res.status(409).json({ error: "Slug already exists" });
    else res.status(500).json({ error: "Failed to create tag" });
  }
});

router.put("/admin/tags/:id", requirePermission("tags", "edit"), async (req, res): Promise<void> => {
  try {
    const { name, slug } = req.body;
    const upd: Record<string, unknown> = {};
    if (name !== undefined) upd.name = name;
    if (slug !== undefined) upd.slug = slug;
    const [tag] = await db.update(tagsTable).set(upd).where(eq(tagsTable.id, parseInt(req.params.id as string))).returning();
    if (!tag) { res.status(404).json({ error: "Not found" }); return; }
    res.json(tag);
  } catch (err: any) {
    if (err?.code === "23505") res.status(409).json({ error: "Slug already exists" });
    else res.status(500).json({ error: "Failed to update tag" });
  }
});

router.delete("/admin/tags/:id", requirePermission("tags", "delete"), async (req, res): Promise<void> => {
  try {
    await db.delete(tagsTable).where(eq(tagsTable.id, parseInt(req.params.id as string)));
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Failed to delete tag" }); }
});

export default router;
