import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { articlesTable } from "@workspace/db";
import { requirePermission } from "../../middleware/requirePermission";
import { logAudit } from "../../lib/audit";

const router = Router();

router.get("/seo", requirePermission("seo", "view"), async (req, res): Promise<void> => {
  try {
    const rows = await db.select({
      id: articlesTable.id, title: articlesTable.title, slug: articlesTable.slug,
      status: articlesTable.status, metaTitle: articlesTable.metaTitle,
      metaDescription: articlesTable.metaDescription, metaKeywords: articlesTable.metaKeywords,
      canonicalUrl: articlesTable.canonicalUrl, ogImage: articlesTable.ogImage,
      noindex: articlesTable.noindex, nofollow: articlesTable.nofollow,
    }).from(articlesTable).orderBy(desc(articlesTable.updatedAt));
    res.json(rows);
  } catch { res.status(500).json({ error: "Failed" }); }
});

router.patch("/seo/:id", requirePermission("seo", "edit"), async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    const { metaTitle, metaDescription, metaKeywords, canonicalUrl, ogImage, noindex, nofollow, structuredData } = req.body;
    const upd: Record<string, unknown> = {};
    if (metaTitle !== undefined) upd.metaTitle = metaTitle;
    if (metaDescription !== undefined) upd.metaDescription = metaDescription;
    if (metaKeywords !== undefined) upd.metaKeywords = metaKeywords;
    if (canonicalUrl !== undefined) upd.canonicalUrl = canonicalUrl;
    if (ogImage !== undefined) upd.ogImage = ogImage;
    if (noindex !== undefined) upd.noindex = noindex;
    if (nofollow !== undefined) upd.nofollow = nofollow;
    if (structuredData !== undefined) upd.structuredData = structuredData;
    const [row] = await db.update(articlesTable).set(upd).where(eq(articlesTable.id, id)).returning();
    await logAudit(req, "update", "seo", id, upd);
    res.json(row);
  } catch { res.status(500).json({ error: "Failed to update SEO" }); }
});

export default router;
