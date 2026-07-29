import { Router } from "express";
import { eq, or, asc } from "drizzle-orm";
import { db } from "@workspace/db";
import { contentRelationshipsTable, articlesTable } from "@workspace/db";
import { requirePermission } from "../../middleware/requirePermission";

const router = Router();

// GET all relationships for an article (as source OR target)
router.get("/admin/articles/:id/relationships", requirePermission("articles", "view"), async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params["id"] as string);
    const rels = await db.select().from(contentRelationshipsTable)
      .where(or(eq(contentRelationshipsTable.sourceArticleId, id), eq(contentRelationshipsTable.targetArticleId, id)))
      .orderBy(asc(contentRelationshipsTable.sortOrder));

    // Hydrate with article titles
    const articleIds = new Set<number>();
    rels.forEach(r => { articleIds.add(r.sourceArticleId); articleIds.add(r.targetArticleId); });
    const articles = articleIds.size > 0
      ? await db.select({ id: articlesTable.id, title: articlesTable.title, slug: articlesTable.slug, contentType: articlesTable.contentType, knowledgeLevel: articlesTable.knowledgeLevel })
          .from(articlesTable)
      : [];
    const aMap = Object.fromEntries(articles.map(a => [a.id, a]));

    res.json(rels.map(r => ({
      ...r,
      sourceArticle: aMap[r.sourceArticleId] ?? { id: r.sourceArticleId, title: `#${r.sourceArticleId}` },
      targetArticle: aMap[r.targetArticleId] ?? { id: r.targetArticleId, title: `#${r.targetArticleId}` },
    })));
  } catch { res.status(500).json({ error: "Failed to load relationships" }); }
});

// CREATE a relationship
router.post("/admin/articles/:id/relationships", requirePermission("articles", "edit"), async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params["id"] as string);
    const { targetArticleId, relationshipType, sortOrder } = req.body;
    const [rel] = await db.insert(contentRelationshipsTable).values({
      sourceArticleId: id,
      targetArticleId: parseInt(targetArticleId),
      relationshipType: relationshipType ?? "related",
      sortOrder: sortOrder ?? 0,
    }).returning();
    res.status(201).json(rel);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to create relationship" });
  }
});

// DELETE a relationship
router.delete("/admin/articles/:id/relationships/:relId", requirePermission("articles", "edit"), async (req, res): Promise<void> => {
  try {
    const relId = parseInt(req.params["relId"] as string);
    await db.delete(contentRelationshipsTable).where(eq(contentRelationshipsTable.id, relId));
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Failed to delete relationship" }); }
});

export default router;
