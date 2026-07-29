import { Router } from "express";
import { eq, asc } from "drizzle-orm";
import { db } from "@workspace/db";
import { learningPathsTable, learningPathItemsTable, articlesTable } from "@workspace/db";
import { requirePermission } from "../../middleware/requirePermission";

const router = Router();

async function getPath(id: number) {
  const [path] = await db.select().from(learningPathsTable).where(eq(learningPathsTable.id, id as number)).limit(1);
  if (!path) return null;
  const items = await db
    .select({ item: learningPathItemsTable, title: articlesTable.title, slug: articlesTable.slug, knowledgeLevel: articlesTable.knowledgeLevel, contentType: articlesTable.contentType })
    .from(learningPathItemsTable)
    .leftJoin(articlesTable, eq(learningPathItemsTable.articleId, articlesTable.id))
    .where(eq(learningPathItemsTable.learningPathId, id))
    .orderBy(asc(learningPathItemsTable.sortOrder));
  return { ...path, items };
}

router.get("/admin/learning-paths", requirePermission("settings", "view"), async (req, res): Promise<void> => {
  try {
    const paths = await db.select().from(learningPathsTable).orderBy(asc(learningPathsTable.sortOrder));
    res.json(paths);
  } catch { res.status(500).json({ error: "Failed to list learning paths" }); }
});

router.get("/admin/learning-paths/:id", requirePermission("settings", "view"), async (req, res): Promise<void> => {
  try {
    const path = await getPath(parseInt(req.params["id"] as string));
    if (!path) { res.status(404).json({ error: "Not found" }); return; }
    res.json(path);
  } catch { res.status(500).json({ error: "Failed to fetch learning path" }); }
});

router.post("/admin/learning-paths", requirePermission("settings", "edit"), async (req, res): Promise<void> => {
  try {
    const { title, slug, description, topicId, sortOrder, items } = req.body;
    const [path] = await db.insert(learningPathsTable).values({
      title, slug, description: description ?? null, topicId: topicId ?? null, sortOrder: sortOrder ?? 0,
    }).returning();
    if (items?.length) {
      await db.insert(learningPathItemsTable).values(
        items.map((item: any, i: number) => ({
          learningPathId: path.id, articleId: item.articleId,
          stage: item.stage ?? "build-understanding", sortOrder: i, notes: item.notes ?? null,
        }))
      );
    }
    res.status(201).json(await getPath(path.id));
  } catch (err: any) {
    if (err?.code === "23505") res.status(409).json({ error: "Slug already exists" });
    else res.status(500).json({ error: "Failed to create learning path" });
  }
});

router.put("/admin/learning-paths/:id", requirePermission("settings", "edit"), async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params["id"] as string);
    const { title, slug, description, topicId, sortOrder, items } = req.body;
    await db.update(learningPathsTable).set({
      title, slug, description: description ?? null, topicId: topicId ?? null, sortOrder: sortOrder ?? 0,
    }).where(eq(learningPathsTable.id, id));
    if (items !== undefined) {
      await db.delete(learningPathItemsTable).where(eq(learningPathItemsTable.learningPathId, id));
      if (items.length) {
        await db.insert(learningPathItemsTable).values(
          items.map((item: any, i: number) => ({
            learningPathId: id, articleId: item.articleId,
            stage: item.stage ?? "build-understanding", sortOrder: i, notes: item.notes ?? null,
          }))
        );
      }
    }
    const path = await getPath(id);
    if (!path) { res.status(404).json({ error: "Not found" }); return; }
    res.json(path);
  } catch (err: any) {
    if (err?.code === "23505") res.status(409).json({ error: "Slug already exists" });
    else res.status(500).json({ error: "Failed to update learning path" });
  }
});

router.delete("/admin/learning-paths/:id", requirePermission("settings", "edit"), async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params["id"] as string);
    await db.delete(learningPathItemsTable).where(eq(learningPathItemsTable.learningPathId, id));
    await db.delete(learningPathsTable).where(eq(learningPathsTable.id, id));
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Failed to delete learning path" }); }
});

export default router;
