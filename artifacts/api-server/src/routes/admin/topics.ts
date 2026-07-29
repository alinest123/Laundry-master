import { Router } from "express";
import { eq, asc, isNull } from "drizzle-orm";
import { db } from "@workspace/db";
import { topicsTable, articleTopicsTable } from "@workspace/db";
import { requirePermission } from "../../middleware/requirePermission";

const router = Router();

// LIST all topics (flat, sorted)
router.get("/admin/topics", requirePermission("settings", "view"), async (req, res): Promise<void> => {
  try {
    const topics = await db.select().from(topicsTable).orderBy(asc(topicsTable.sortOrder), asc(topicsTable.name));
    res.json(topics);
  } catch { res.status(500).json({ error: "Failed to list topics" }); }
});

// GET one
router.get("/admin/topics/:id", requirePermission("settings", "view"), async (req, res): Promise<void> => {
  try {
    const [topic] = await db.select().from(topicsTable).where(eq(topicsTable.id, parseInt(req.params["id"] as string))).limit(1);
    if (!topic) { res.status(404).json({ error: "Not found" }); return; }
    res.json(topic);
  } catch { res.status(500).json({ error: "Failed to fetch topic" }); }
});

// CREATE
router.post("/admin/topics", requirePermission("settings", "edit"), async (req, res): Promise<void> => {
  try {
    const { name, slug, description, featuredImage, parentId, sortOrder } = req.body;
    const [topic] = await db.insert(topicsTable).values({
      name, slug, description: description ?? null,
      featuredImage: featuredImage ?? null,
      parentId: parentId ?? null,
      sortOrder: sortOrder ?? 0,
    }).returning();
    res.status(201).json(topic);
  } catch (err: any) {
    if (err?.code === "23505") res.status(409).json({ error: "Slug already exists" });
    else res.status(500).json({ error: "Failed to create topic" });
  }
});

// UPDATE
router.put("/admin/topics/:id", requirePermission("settings", "edit"), async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params["id"] as string);
    const { name, slug, description, featuredImage, parentId, sortOrder } = req.body;
    const [topic] = await db.update(topicsTable).set({
      name, slug,
      description: description ?? null,
      featuredImage: featuredImage ?? null,
      parentId: parentId ?? null,
      sortOrder: sortOrder ?? 0,
    }).where(eq(topicsTable.id, id)).returning();
    if (!topic) { res.status(404).json({ error: "Not found" }); return; }
    res.json(topic);
  } catch (err: any) {
    if (err?.code === "23505") res.status(409).json({ error: "Slug already exists" });
    else res.status(500).json({ error: "Failed to update topic" });
  }
});

// DELETE
router.delete("/admin/topics/:id", requirePermission("settings", "edit"), async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params["id"] as string);
    await db.delete(articleTopicsTable).where(eq(articleTopicsTable.topicId, id));
    await db.delete(topicsTable).where(eq(topicsTable.id, id));
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Failed to delete topic" }); }
});

export default router;
