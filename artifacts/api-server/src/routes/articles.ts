import { Router } from "express";
import { eq, desc, ilike, or, and, sql, inArray } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  articlesTable,
  authorsTable,
  categoriesTable,
  tagsTable,
  articleCategoriesTable,
  articleTagsTable,
} from "@workspace/db";
import {
  ListArticlesQueryParams,
  GetFeaturedArticlesQueryParams,
  GetPopularArticlesQueryParams,
  GetLatestArticlesQueryParams,
  GetArticleParams,
} from "@workspace/api-zod";

const router = Router();

async function getArticleWithRelations(articleId: number) {
  const article = await db.select().from(articlesTable).where(eq(articlesTable.id, articleId)).limit(1);
  if (!article[0]) return null;

  const author = await db.select().from(authorsTable).where(eq(authorsTable.id, article[0].authorId)).limit(1);
  const catLinks = await db.select().from(articleCategoriesTable).where(eq(articleCategoriesTable.articleId, articleId));
  const tagLinks = await db.select().from(articleTagsTable).where(eq(articleTagsTable.articleId, articleId));

  const categories = catLinks.length > 0
    ? await db.select().from(categoriesTable).where(inArray(categoriesTable.id, catLinks.map(c => c.categoryId)))
    : [];
  const tags = tagLinks.length > 0
    ? await db.select().from(tagsTable).where(inArray(tagsTable.id, tagLinks.map(t => t.tagId)))
    : [];

  const subcatMap = await Promise.all(categories.map(async (cat) => {
    const subs = await db.select().from(categoriesTable).where(eq(categoriesTable.parentId, cat.id));
    return { ...cat, subcategories: subs, articleCount: cat.id };
  }));

  return {
    ...article[0],
    author: author[0] ?? { id: 0, name: "Unknown", bio: null, avatar: null, role: "Author", articleCount: 0 },
    categories: subcatMap.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      featuredImage: c.featuredImage,
      articleCount: 0,
      parentId: c.parentId,
      subcategories: c.subcategories.map(s => ({ id: s.id, name: s.name, slug: s.slug, description: s.description, featuredImage: s.featuredImage, articleCount: 0, parentId: s.parentId, subcategories: [] })),
    })),
    tags: tags.map(t => ({ id: t.id, name: t.name, slug: t.slug, articleCount: t.articleCount })),
  };
}

async function buildArticleSummary(article: typeof articlesTable.$inferSelect) {
  const full = await getArticleWithRelations(article.id);
  if (!full) return null;
  return {
    id: full.id,
    title: full.title,
    slug: full.slug,
    excerpt: full.excerpt,
    featuredImage: full.featuredImage,
    readingTime: full.readingTime,
    publishedAt: full.publishedAt?.toISOString() ?? null,
    views: full.views,
    author: full.author,
    categories: full.categories,
    tags: full.tags,
  };
}

router.get("/articles", async (req, res): Promise<void> => {
  const parsed = ListArticlesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { page = 1, limit = 12, category, tag, status } = parsed.data;
  const offset = (page - 1) * limit;

  let articleIds: number[] | undefined;

  if (category) {
    const cat = await db.select({ id: categoriesTable.id }).from(categoriesTable).where(eq(categoriesTable.slug, category)).limit(1);
    if (cat[0]) {
      const links = await db.select({ articleId: articleCategoriesTable.articleId }).from(articleCategoriesTable).where(eq(articleCategoriesTable.categoryId, cat[0].id));
      articleIds = links.map(l => l.articleId);
    }
  }

  if (tag) {
    const t = await db.select({ id: tagsTable.id }).from(tagsTable).where(eq(tagsTable.slug, tag)).limit(1);
    if (t[0]) {
      const links = await db.select({ articleId: articleTagsTable.articleId }).from(articleTagsTable).where(eq(articleTagsTable.tagId, t[0].id));
      const tagArticleIds = links.map(l => l.articleId);
      articleIds = articleIds ? articleIds.filter(id => tagArticleIds.includes(id)) : tagArticleIds;
    }
  }

  let query = db.select().from(articlesTable).$dynamic();
  let countQuery = db.select({ count: sql<number>`count(*)` }).from(articlesTable).$dynamic();

  const conditions = [];
  if (status) conditions.push(eq(articlesTable.status, status));
  else conditions.push(eq(articlesTable.status, "published"));
  if (articleIds !== undefined) {
    if (articleIds.length === 0) {
      res.json({ articles: [], total: 0, page, limit, totalPages: 0 });
      return;
    }
    conditions.push(inArray(articlesTable.id, articleIds));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
    countQuery = countQuery.where(and(...conditions));
  }

  const [total, rows] = await Promise.all([
    countQuery,
    query.orderBy(desc(articlesTable.publishedAt)).limit(limit).offset(offset),
  ]);

  const articles = await Promise.all(rows.map(buildArticleSummary));
  res.json({
    articles: articles.filter(Boolean),
    total: Number(total[0]?.count ?? 0),
    page,
    limit,
    totalPages: Math.ceil(Number(total[0]?.count ?? 0) / limit),
  });
});

router.get("/articles/featured", async (req, res): Promise<void> => {
  const parsed = GetFeaturedArticlesQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 6) : 6;
  const rows = await db.select().from(articlesTable)
    .where(and(eq(articlesTable.status, "published"), eq(articlesTable.isFeatured, 1)))
    .orderBy(desc(articlesTable.publishedAt)).limit(limit);
  const articles = await Promise.all(rows.map(buildArticleSummary));
  res.json(articles.filter(Boolean));
});

router.get("/articles/popular", async (req, res): Promise<void> => {
  const parsed = GetPopularArticlesQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 8) : 8;
  const rows = await db.select().from(articlesTable)
    .where(eq(articlesTable.status, "published"))
    .orderBy(desc(articlesTable.views)).limit(limit);
  const articles = await Promise.all(rows.map(buildArticleSummary));
  res.json(articles.filter(Boolean));
});

router.get("/articles/latest", async (req, res): Promise<void> => {
  const parsed = GetLatestArticlesQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 6) : 6;
  const rows = await db.select().from(articlesTable)
    .where(eq(articlesTable.status, "published"))
    .orderBy(desc(articlesTable.publishedAt)).limit(limit);
  const articles = await Promise.all(rows.map(buildArticleSummary));
  res.json(articles.filter(Boolean));
});

router.get("/articles/:slug", async (req, res): Promise<void> => {
  const rawSlug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const parsed = GetArticleParams.safeParse({ slug: rawSlug });
  if (!parsed.success) { res.status(400).json({ error: "Invalid slug" }); return; }

  const rows = await db.select().from(articlesTable).where(eq(articlesTable.slug, parsed.data.slug)).limit(1);
  if (!rows[0]) { res.status(404).json({ error: "Not found" }); return; }

  // Increment views
  await db.update(articlesTable).set({ views: rows[0].views + 1 }).where(eq(articlesTable.id, rows[0].id));

  const full = await getArticleWithRelations(rows[0].id);
  if (!full) { res.status(404).json({ error: "Not found" }); return; }

  // Get related articles (same category)
  let related: Awaited<ReturnType<typeof buildArticleSummary>>[] = [];
  if (full.categories.length > 0) {
    const catLinks = await db.select({ articleId: articleCategoriesTable.articleId })
      .from(articleCategoriesTable)
      .where(eq(articleCategoriesTable.categoryId, full.categories[0].id));
    const relatedIds = catLinks.map(l => l.articleId).filter(id => id !== rows[0].id).slice(0, 4);
    if (relatedIds.length > 0) {
      const relRows = await db.select().from(articlesTable).where(inArray(articlesTable.id, relatedIds));
      related = await Promise.all(relRows.map(buildArticleSummary));
    }
  }

  // Build table of contents from content headings
  const headingRegex = /^(#{1,3})\s+(.+)$/gm;
  const toc: { id: string; title: string; level: number }[] = [];
  let match;
  while ((match = headingRegex.exec(full.content)) !== null) {
    toc.push({
      id: match[2].toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      title: match[2],
      level: match[1].length,
    });
  }

  res.json({
    id: full.id,
    title: full.title,
    slug: full.slug,
    excerpt: full.excerpt,
    content: full.content,
    featuredImage: full.featuredImage,
    readingTime: full.readingTime,
    publishedAt: full.publishedAt?.toISOString() ?? null,
    status: full.status,
    views: full.views + 1,
    author: full.author,
    categories: full.categories,
    tags: full.tags,
    relatedArticles: related.filter(Boolean),
    tableOfContents: toc,
  });
});

export default router;
