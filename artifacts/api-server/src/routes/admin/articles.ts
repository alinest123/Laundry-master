import { Router } from "express";
import { eq, desc, ilike, and, inArray } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  articlesTable, articleCategoriesTable, articleTagsTable,
  articleRelatedTable, articleImagesTable, articleFaqsTable,
  articleReferencesTable, authorsTable, categoriesTable, tagsTable,
} from "@workspace/db";

const router = Router();

async function getAdminArticle(id: number) {
  const rows = await db.select().from(articlesTable).where(eq(articlesTable.id, id)).limit(1);
  if (!rows[0]) return null;

  const [catLinks, tagLinks, relatedLinks, images, faqs, refs, authorRows] = await Promise.all([
    db.select().from(articleCategoriesTable).where(eq(articleCategoriesTable.articleId, id)),
    db.select().from(articleTagsTable).where(eq(articleTagsTable.articleId, id)),
    db.select().from(articleRelatedTable).where(eq(articleRelatedTable.articleId, id)),
    db.select().from(articleImagesTable).where(eq(articleImagesTable.articleId, id)).orderBy(articleImagesTable.sortOrder),
    db.select().from(articleFaqsTable).where(eq(articleFaqsTable.articleId, id)).orderBy(articleFaqsTable.sortOrder),
    db.select().from(articleReferencesTable).where(eq(articleReferencesTable.articleId, id)).orderBy(articleReferencesTable.sortOrder),
    db.select().from(authorsTable).where(eq(authorsTable.id, rows[0].authorId)).limit(1),
  ]);

  return {
    ...rows[0],
    author: authorRows[0] ?? null,
    categoryIds: catLinks.map(c => c.categoryId),
    tagIds: tagLinks.map(t => t.tagId),
    relatedArticleIds: relatedLinks.map(r => r.relatedArticleId),
    images,
    faqs,
    references: refs,
  };
}

async function syncRelations(articleId: number, data: {
  categoryIds?: number[]; tagIds?: number[]; relatedArticleIds?: number[];
  images?: { url: string; caption?: string; altText?: string; sortOrder?: number }[];
  faqs?: { question: string; answer: string; sortOrder?: number }[];
  references?: { title: string; url?: string; description?: string; refType?: string; sortOrder?: number }[];
}) {
  const ops: Promise<unknown>[] = [];

  if (data.categoryIds !== undefined) {
    ops.push(db.delete(articleCategoriesTable).where(eq(articleCategoriesTable.articleId, articleId)).then(() =>
      data.categoryIds!.length > 0
        ? db.insert(articleCategoriesTable).values(data.categoryIds!.map(cid => ({ articleId, categoryId: cid })))
        : null
    ));
  }
  if (data.tagIds !== undefined) {
    ops.push(db.delete(articleTagsTable).where(eq(articleTagsTable.articleId, articleId)).then(() =>
      data.tagIds!.length > 0
        ? db.insert(articleTagsTable).values(data.tagIds!.map(tid => ({ articleId, tagId: tid })))
        : null
    ));
  }
  if (data.relatedArticleIds !== undefined) {
    ops.push(db.delete(articleRelatedTable).where(eq(articleRelatedTable.articleId, articleId)).then(() =>
      data.relatedArticleIds!.length > 0
        ? db.insert(articleRelatedTable).values(data.relatedArticleIds!.map(rid => ({ articleId, relatedArticleId: rid })))
        : null
    ));
  }
  if (data.images !== undefined) {
    ops.push(db.delete(articleImagesTable).where(eq(articleImagesTable.articleId, articleId)).then(() =>
      data.images!.length > 0
        ? db.insert(articleImagesTable).values(data.images!.map((img, i) => ({
            articleId, url: img.url, caption: img.caption ?? null,
            altText: img.altText ?? null, sortOrder: img.sortOrder ?? i,
          })))
        : null
    ));
  }
  if (data.faqs !== undefined) {
    ops.push(db.delete(articleFaqsTable).where(eq(articleFaqsTable.articleId, articleId)).then(() =>
      data.faqs!.length > 0
        ? db.insert(articleFaqsTable).values(data.faqs!.map((faq, i) => ({
            articleId, question: faq.question, answer: faq.answer, sortOrder: faq.sortOrder ?? i,
          })))
        : null
    ));
  }
  if (data.references !== undefined) {
    ops.push(db.delete(articleReferencesTable).where(eq(articleReferencesTable.articleId, articleId)).then(() =>
      data.references!.length > 0
        ? db.insert(articleReferencesTable).values(data.references!.map((ref, i) => ({
            articleId, title: ref.title, url: ref.url ?? null,
            description: ref.description ?? null, refType: ref.refType ?? "reference", sortOrder: ref.sortOrder ?? i,
          })))
        : null
    ));
  }

  await Promise.all(ops);
}

// ── LIST ──────────────────────────────────────────────────────────────────────
router.get("/admin/articles", async (req, res): Promise<void> => {
  try {
    const { status, search, page = "1", limit = "20" } = req.query as Record<string, string>;
    const p = Math.max(1, parseInt(page)), l = Math.min(100, parseInt(limit));
    const offset = (p - 1) * l;

    let q = db.select().from(articlesTable).$dynamic();
    const conds = [];
    if (status) conds.push(eq(articlesTable.status, status));
    if (search) conds.push(ilike(articlesTable.title, `%${search}%`));
    if (conds.length) q = q.where(and(...conds));

    const rows = await q.orderBy(desc(articlesTable.updatedAt)).limit(l).offset(offset);
    const authorIds = [...new Set(rows.map(r => r.authorId))];
    const authors = authorIds.length
      ? await db.select({ id: authorsTable.id, name: authorsTable.name }).from(authorsTable).where(inArray(authorsTable.id, authorIds))
      : [];
    const aMap = Object.fromEntries(authors.map(a => [a.id, a.name]));

    res.json({ articles: rows.map(r => ({ ...r, authorName: aMap[r.authorId] ?? "Unknown" })), page: p, limit: l });
  } catch { res.status(500).json({ error: "Failed to list articles" }); }
});

// ── GET ONE ───────────────────────────────────────────────────────────────────
router.get("/admin/articles/:id", async (req, res): Promise<void> => {
  try {
    const a = await getAdminArticle(parseInt(req.params.id));
    if (!a) { res.status(404).json({ error: "Not found" }); return; }
    res.json(a);
  } catch { res.status(500).json({ error: "Failed to fetch article" }); }
});

// ── CREATE ────────────────────────────────────────────────────────────────────
router.post("/admin/articles", async (req, res): Promise<void> => {
  try {
    const { categoryIds, tagIds, relatedArticleIds, images, faqs, references, ...f } = req.body;
    const [article] = await db.insert(articlesTable).values({
      title: f.title, slug: f.slug, excerpt: f.excerpt ?? null,
      content: f.content ?? "", featuredImage: f.featuredImage ?? null,
      readingTime: f.readingTime ?? 5, status: f.status ?? "draft",
      authorId: f.authorId, isFeatured: f.isFeatured ? 1 : 0,
      publishedAt: f.publishedAt ? new Date(f.publishedAt) : null,
      scheduledAt: f.scheduledAt ? new Date(f.scheduledAt) : null,
      metaTitle: f.metaTitle ?? null, metaDescription: f.metaDescription ?? null,
      metaKeywords: f.metaKeywords ?? null, canonicalUrl: f.canonicalUrl ?? null,
      ogImage: f.ogImage ?? null, structuredData: f.structuredData ?? null,
      noindex: f.noindex ?? false, nofollow: f.nofollow ?? false, tocEnabled: f.tocEnabled ?? false,
    }).returning();

    await syncRelations(article.id, { categoryIds, tagIds, relatedArticleIds, images, faqs, references });
    res.status(201).json(await getAdminArticle(article.id));
  } catch (err: any) {
    if (err?.code === "23505") res.status(409).json({ error: "Slug already exists" });
    else res.status(500).json({ error: "Failed to create article" });
  }
});

// ── UPDATE ────────────────────────────────────────────────────────────────────
router.put("/admin/articles/:id", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { categoryIds, tagIds, relatedArticleIds, images, faqs, references, ...f } = req.body;

    const upd: Record<string, unknown> = {};
    const str = (k: string) => { if (f[k] !== undefined) upd[k] = f[k]; };
    const bool = (k: string) => { if (f[k] !== undefined) upd[k] = f[k]; };
    ["title","slug","excerpt","content","featuredImage","readingTime","status","authorId",
     "metaTitle","metaDescription","metaKeywords","canonicalUrl","ogImage","structuredData"].forEach(str);
    ["noindex","nofollow","tocEnabled"].forEach(bool);
    if (f.isFeatured !== undefined) upd.isFeatured = f.isFeatured ? 1 : 0;
    if (f.publishedAt !== undefined) upd.publishedAt = f.publishedAt ? new Date(f.publishedAt) : null;
    if (f.scheduledAt !== undefined) upd.scheduledAt = f.scheduledAt ? new Date(f.scheduledAt) : null;

    if (Object.keys(upd).length) await db.update(articlesTable).set(upd).where(eq(articlesTable.id, id));
    await syncRelations(id, { categoryIds, tagIds, relatedArticleIds, images, faqs, references });

    const a = await getAdminArticle(id);
    if (!a) { res.status(404).json({ error: "Not found" }); return; }
    res.json(a);
  } catch (err: any) {
    if (err?.code === "23505") res.status(409).json({ error: "Slug already exists" });
    else res.status(500).json({ error: "Failed to update article" });
  }
});

// ── DELETE ────────────────────────────────────────────────────────────────────
router.delete("/admin/articles/:id", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    await Promise.all([
      db.delete(articleCategoriesTable).where(eq(articleCategoriesTable.articleId, id)),
      db.delete(articleTagsTable).where(eq(articleTagsTable.articleId, id)),
      db.delete(articleRelatedTable).where(eq(articleRelatedTable.articleId, id)),
      db.delete(articleImagesTable).where(eq(articleImagesTable.articleId, id)),
      db.delete(articleFaqsTable).where(eq(articleFaqsTable.articleId, id)),
      db.delete(articleReferencesTable).where(eq(articleReferencesTable.articleId, id)),
    ]);
    await db.delete(articlesTable).where(eq(articlesTable.id, id));
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Failed to delete" }); }
});

// ── PUBLISH / UNPUBLISH / SCHEDULE ───────────────────────────────────────────
router.post("/admin/articles/:id/publish", async (req, res): Promise<void> => {
  try {
    await db.update(articlesTable).set({ status: "published", publishedAt: new Date() }).where(eq(articlesTable.id, parseInt(req.params.id)));
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Failed to publish" }); }
});

router.post("/admin/articles/:id/unpublish", async (req, res): Promise<void> => {
  try {
    await db.update(articlesTable).set({ status: "archived" }).where(eq(articlesTable.id, parseInt(req.params.id)));
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Failed to unpublish" }); }
});

router.post("/admin/articles/:id/schedule", async (req, res): Promise<void> => {
  try {
    const { scheduledAt } = req.body;
    await db.update(articlesTable).set({ status: "scheduled", scheduledAt: new Date(scheduledAt) }).where(eq(articlesTable.id, parseInt(req.params.id)));
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Failed to schedule" }); }
});

export default router;
