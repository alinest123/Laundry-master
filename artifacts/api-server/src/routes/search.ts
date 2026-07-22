import { Router } from "express";
import { ilike, eq, or } from "drizzle-orm";
import { db } from "@workspace/db";
import { articlesTable, categoriesTable } from "@workspace/db";
import { SearchContentQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/search", async (req, res): Promise<void> => {
  const parsed = SearchContentQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { q, type = "all", limit = 10 } = parsed.data;

  const results: { id: number; type: string; title: string; slug: string; excerpt: string | null; featuredImage: string | null }[] = [];

  if (type === "all" || type === "articles") {
    const rows = await db.select().from(articlesTable)
      .where(or(ilike(articlesTable.title, `%${q}%`), ilike(articlesTable.excerpt, `%${q}%`), ilike(articlesTable.content, `%${q}%`)))
      .limit(limit);
    rows.forEach(r => results.push({ id: r.id, type: "article", title: r.title, slug: r.slug, excerpt: r.excerpt, featuredImage: r.featuredImage }));
  }

  if (type === "all" || type === "categories") {
    const rows = await db.select().from(categoriesTable)
      .where(or(ilike(categoriesTable.name, `%${q}%`), ilike(categoriesTable.description, `%${q}%`)))
      .limit(limit);
    rows.forEach(r => results.push({ id: r.id, type: "category", title: r.name, slug: r.slug, excerpt: r.description, featuredImage: r.featuredImage }));
  }

  res.json({ results: results.slice(0, limit), total: results.length, query: q });
});

export default router;
