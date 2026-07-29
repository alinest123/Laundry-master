import { Router } from "express";
import { eq, and, desc, asc, ilike, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { articlesTable, topicsTable, articleTopicsTable, learningPathsTable, learningPathItemsTable } from "@workspace/db";

const router = Router();

// Content type → "section" mapping for legacy compatibility
const CONTENT_TYPE_TO_SECTION: Record<string, string> = {
  "professional-article": "guides",
  "practical-guide":      "guides",
  "best-practice-guide":  "guides",
  "sop":                  "guides",
  "technical-article":    "research",
  "research-paper":       "research",
  "white-paper":          "research",
  "technical-reference":  "research",
  "case-study":           "case-studies",
  "expert-interview":     "case-studies",
  "industry-heritage":    "case-studies",
  "professional-profile": "case-studies",
  "60-second":            "quick",
  "editorial":            "guides",
};

router.get("/knowledge", async (req, res): Promise<void> => {
  try {
    const { contentType, knowledgeLevel, topicId, difficulty, search } = req.query as Record<string, string>;

    // Build query with filters
    let q = db.select({
      id: articlesTable.id, title: articlesTable.title, slug: articlesTable.slug,
      excerpt: articlesTable.excerpt, readingTime: articlesTable.readingTime,
      contentType: articlesTable.contentType, knowledgeLevel: articlesTable.knowledgeLevel,
      difficulty: articlesTable.difficulty, expertReviewStatus: articlesTable.expertReviewStatus,
      featuredImage: articlesTable.featuredImage, publishedAt: articlesTable.publishedAt,
      views: articlesTable.views,
    }).from(articlesTable).$dynamic();

    const conds = [eq(articlesTable.status, "published")];
    if (contentType) conds.push(eq(articlesTable.contentType, contentType));
    if (knowledgeLevel) conds.push(eq(articlesTable.knowledgeLevel, knowledgeLevel));
    if (difficulty) conds.push(eq(articlesTable.difficulty, difficulty));
    if (search) conds.push(ilike(articlesTable.title, `%${search}%`));
    q = q.where(and(...conds));

    // If topicId filter, join with article_topics
    let articles: any[];
    if (topicId) {
      const topicArticleIds = (await db.select({ articleId: articleTopicsTable.articleId })
        .from(articleTopicsTable).where(eq(articleTopicsTable.topicId, parseInt(topicId)))).map(r => r.articleId);
      const allRows = await q.orderBy(desc(articlesTable.publishedAt));
      articles = allRows.filter(a => topicArticleIds.includes(a.id));
    } else {
      articles = await q.orderBy(desc(articlesTable.publishedAt));
    }

    // Get topics with article counts
    const allTopics = await db.select().from(topicsTable).orderBy(asc(topicsTable.sortOrder), asc(topicsTable.name));
    const topicCounts: Record<number, number> = {};
    const topicArticleLinks = await db.select().from(articleTopicsTable);
    topicArticleLinks.forEach(l => { topicCounts[l.topicId] = (topicCounts[l.topicId] ?? 0) + 1; });

    // Get real learning paths
    const paths = await db.select().from(learningPathsTable).orderBy(asc(learningPathsTable.sortOrder)).limit(4);
    const pathItemCounts = await Promise.all(paths.map(p =>
      db.select({ count: sql<number>`count(*)::int` }).from(learningPathItemsTable).where(eq(learningPathItemsTable.learningPathId, p.id))
    ));

    // Group articles by section
    const bySection: Record<string, typeof articles> = {};
    articles.forEach(a => {
      const s = CONTENT_TYPE_TO_SECTION[a.contentType] ?? "guides";
      if (!bySection[s]) bySection[s] = [];
      bySection[s].push(a);
    });

    // Legacy section data (counts as items)
    const sectionSummary = (sectionKey: string) => {
      const items = bySection[sectionKey] ?? [];
      return { count: items.length, articles: items.slice(0, 8) };
    };

    const learningPathItems = paths.map((p, i) => ({
      title: p.title, slug: p.slug, description: p.description ?? "",
      count: pathItemCounts[i]?.[0]?.count ?? 0,
    }));

    res.json({
      articles,
      topics: allTopics.map(t => ({ ...t, articleCount: topicCounts[t.id] ?? 0 })),
      guides: sectionSummary("guides").articles,
      research: sectionSummary("research").articles,
      caseStudies: sectionSummary("case-studies").articles,
      quickKnowledge: sectionSummary("quick").articles,
      learningPaths: learningPathItems,
      totalItems: articles.length,
      filters: { contentType: contentType ?? null, knowledgeLevel: knowledgeLevel ?? null, topicId: topicId ?? null, difficulty: difficulty ?? null },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load knowledge hub" });
  }
});

// Public topic page — articles for a specific topic
router.get("/knowledge/topic/:slug", async (req, res): Promise<void> => {
  try {
    const [topic] = await db.select().from(topicsTable)
      .where(eq(topicsTable.slug, req.params["slug"] as string)).limit(1);
    if (!topic) { res.status(404).json({ error: "Topic not found" }); return; }

    const subtopics = await db.select().from(topicsTable)
      .where(eq(topicsTable.parentId, topic.id)).orderBy(asc(topicsTable.sortOrder));

    const topicArticleIds = (await db.select({ articleId: articleTopicsTable.articleId })
      .from(articleTopicsTable).where(eq(articleTopicsTable.topicId, topic.id))).map(r => r.articleId);

    const articles = topicArticleIds.length
      ? await db.select({
          id: articlesTable.id, title: articlesTable.title, slug: articlesTable.slug,
          excerpt: articlesTable.excerpt, readingTime: articlesTable.readingTime,
          contentType: articlesTable.contentType, knowledgeLevel: articlesTable.knowledgeLevel,
          difficulty: articlesTable.difficulty, expertReviewStatus: articlesTable.expertReviewStatus,
          featuredImage: articlesTable.featuredImage, publishedAt: articlesTable.publishedAt,
        }).from(articlesTable)
          .where(and(eq(articlesTable.status, "published")))
          .orderBy(desc(articlesTable.publishedAt))
      : [];

    res.json({ topic, subtopics, articles: articles.filter(a => topicArticleIds.includes(a.id)) });
  } catch { res.status(500).json({ error: "Failed to load topic" }); }
});

export default router;
