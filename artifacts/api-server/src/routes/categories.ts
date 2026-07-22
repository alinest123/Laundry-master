import { Router } from "express";
import { eq, sql, inArray } from "drizzle-orm";
import { db } from "@workspace/db";
import { categoriesTable, articlesTable, articleCategoriesTable } from "@workspace/db";
import { ListCategoriesQueryParams, GetCategoryDetailParams } from "@workspace/api-zod";

const router = Router();

async function buildCategoryWithCount(cat: typeof categoriesTable.$inferSelect) {
  const links = await db.select({ count: sql<number>`count(*)` })
    .from(articleCategoriesTable)
    .where(eq(articleCategoriesTable.categoryId, cat.id));
  const subs = await db.select().from(categoriesTable).where(eq(categoriesTable.parentId, cat.id));
  const subWithCount = await Promise.all(subs.map(async (s) => {
    const sl = await db.select({ count: sql<number>`count(*)` })
      .from(articleCategoriesTable).where(eq(articleCategoriesTable.categoryId, s.id));
    return { id: s.id, name: s.name, slug: s.slug, description: s.description, featuredImage: s.featuredImage, articleCount: Number(sl[0]?.count ?? 0), parentId: s.parentId, subcategories: [] };
  }));
  return {
    id: cat.id, name: cat.name, slug: cat.slug, description: cat.description,
    featuredImage: cat.featuredImage, articleCount: Number(links[0]?.count ?? 0),
    parentId: cat.parentId, subcategories: subWithCount,
  };
}

router.get("/categories", async (req, res): Promise<void> => {
  const parsed = ListCategoriesQueryParams.safeParse(req.query);
  const parentOnly = parsed.success ? parsed.data.parentOnly : undefined;

  let rows;
  if (parentOnly) {
    rows = await db.select().from(categoriesTable).where(sql`${categoriesTable.parentId} IS NULL`);
  } else {
    rows = await db.select().from(categoriesTable);
  }

  const result = await Promise.all(rows.map(buildCategoryWithCount));
  res.json(result);
});

router.get("/categories/:slug", async (req, res): Promise<void> => {
  const rawSlug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const parsed = GetCategoryDetailParams.safeParse({ slug: rawSlug });
  if (!parsed.success) { res.status(400).json({ error: "Invalid slug" }); return; }

  const rows = await db.select().from(categoriesTable).where(eq(categoriesTable.slug, parsed.data.slug)).limit(1);
  if (!rows[0]) { res.status(404).json({ error: "Not found" }); return; }

  const cat = await buildCategoryWithCount(rows[0]);

  // Get articles in this category
  const links = await db.select({ articleId: articleCategoriesTable.articleId })
    .from(articleCategoriesTable).where(eq(articleCategoriesTable.categoryId, rows[0].id));
  
  const articles = links.length > 0
    ? await db.select().from(articlesTable)
        .where(inArray(articlesTable.id, links.map(l => l.articleId)))
    : [];

  const articleSummaries = articles.map(a => ({
    id: a.id, title: a.title, slug: a.slug, excerpt: a.excerpt,
    featuredImage: a.featuredImage, readingTime: a.readingTime,
    publishedAt: a.publishedAt?.toISOString() ?? null, views: a.views,
    author: { id: a.authorId, name: "Expert", bio: null, avatar: null, role: "Author", articleCount: 0 },
    categories: [cat], tags: [],
  }));

  res.json({ category: cat, articles: articleSummaries, total: articleSummaries.length, page: 1, totalPages: 1 });
});

export default router;
