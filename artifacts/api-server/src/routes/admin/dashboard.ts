import { Router } from "express";
import { eq, sql, desc, gt, and } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  articlesTable, categoriesTable, tagsTable, authorsTable,
  articleCommentsTable, usersTable, mediaLibraryTable,
  newsletterSubscribersTable, paymentsTable, appointmentsTable,
} from "@workspace/db";
import { requirePermission } from "../../middleware/requirePermission";

const router = Router();

/** GET /admin/dashboard/stats — all at-a-glance counts in one shot */
router.get("/dashboard/stats", requirePermission("dashboard", "view"), async (_req, res): Promise<void> => {
  try {
    const [articleStats, cats, tags, authors, pending, users, media, subs, payments] = await Promise.all([
      db.select({
        published: sql<number>`count(*) filter (where ${articlesTable.status} = 'published')`,
        draft:     sql<number>`count(*) filter (where ${articlesTable.status} = 'draft')`,
        scheduled: sql<number>`count(*) filter (where ${articlesTable.status} = 'scheduled')`,
        archived:  sql<number>`count(*) filter (where ${articlesTable.status} = 'archived')`,
      }).from(articlesTable),
      db.select({ count: sql<number>`count(*)` }).from(categoriesTable),
      db.select({ count: sql<number>`count(*)` }).from(tagsTable),
      db.select({ count: sql<number>`count(*)` }).from(authorsTable),
      db.select({ count: sql<number>`count(*)` }).from(articleCommentsTable).where(eq(articleCommentsTable.isApproved, 0)),
      db.select({ count: sql<number>`count(*)` }).from(usersTable),
      db.select({ count: sql<number>`count(*)` }).from(mediaLibraryTable),
      db.select({ count: sql<number>`count(*)` }).from(newsletterSubscribersTable),
      db.select({ count: sql<number>`count(*)` }).from(paymentsTable),
    ]);

    res.json({
      articles: {
        published: Number(articleStats[0].published),
        draft:     Number(articleStats[0].draft),
        scheduled: Number(articleStats[0].scheduled),
        archived:  Number(articleStats[0].archived),
      },
      categories:      Number(cats[0].count),
      tags:            Number(tags[0].count),
      authors:         Number(authors[0].count),
      pendingComments: Number(pending[0].count),
      users:           Number(users[0].count),
      media:           Number(media[0].count),
      subscribers:     Number(subs[0].count),
      payments:        Number(payments[0].count),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load dashboard stats" });
  }
});

/** GET /admin/dashboard/activity — recent published, upcoming scheduled, pending comments */
router.get("/dashboard/activity", requirePermission("dashboard", "view"), async (_req, res): Promise<void> => {
  try {
    const now = new Date();

    const [recentPublished, scheduled, pendingComments] = await Promise.all([
      db.select({
        id:          articlesTable.id,
        title:       articlesTable.title,
        slug:        articlesTable.slug,
        publishedAt: articlesTable.publishedAt,
        authorName:  authorsTable.name,
      })
        .from(articlesTable)
        .leftJoin(authorsTable, eq(articlesTable.authorId, authorsTable.id))
        .where(eq(articlesTable.status, "published"))
        .orderBy(desc(articlesTable.publishedAt))
        .limit(5),

      db.select({
        id:          articlesTable.id,
        title:       articlesTable.title,
        slug:        articlesTable.slug,
        scheduledAt: articlesTable.scheduledAt,
        authorName:  authorsTable.name,
      })
        .from(articlesTable)
        .leftJoin(authorsTable, eq(articlesTable.authorId, authorsTable.id))
        .where(and(eq(articlesTable.status, "scheduled"), gt(articlesTable.scheduledAt, now)))
        .orderBy(articlesTable.scheduledAt)
        .limit(5),

      db.select({
        id:           articleCommentsTable.id,
        authorName:   articleCommentsTable.authorName,
        content:      articleCommentsTable.content,
        createdAt:    articleCommentsTable.createdAt,
        articleTitle: articlesTable.title,
        articleId:    articleCommentsTable.articleId,
      })
        .from(articleCommentsTable)
        .leftJoin(articlesTable, eq(articleCommentsTable.articleId, articlesTable.id))
        .where(eq(articleCommentsTable.isApproved, 0))
        .orderBy(desc(articleCommentsTable.createdAt))
        .limit(10),
    ]);

    res.json({
      recentPublished: recentPublished.map(a => ({ ...a, publishedAt: a.publishedAt?.toISOString() ?? null })),
      scheduled:       scheduled.map(a => ({ ...a, scheduledAt: a.scheduledAt?.toISOString() ?? null })),
      pendingComments: pendingComments.map(c => ({ ...c, createdAt: c.createdAt.toISOString() })),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load dashboard activity" });
  }
});

/** GET /admin/dashboard/top-articles — top 5 published by views */
router.get("/dashboard/top-articles", requirePermission("dashboard", "view"), async (_req, res): Promise<void> => {
  try {
    const rows = await db.select({
      id:         articlesTable.id,
      title:      articlesTable.title,
      slug:       articlesTable.slug,
      views:      articlesTable.views,
      authorName: authorsTable.name,
    })
      .from(articlesTable)
      .leftJoin(authorsTable, eq(articlesTable.authorId, authorsTable.id))
      .where(eq(articlesTable.status, "published"))
      .orderBy(desc(articlesTable.views))
      .limit(5);
    res.json(rows);
  } catch {
    res.status(500).json({ error: "Failed to load top articles" });
  }
});

/** GET /admin/dashboard/upcoming-appointments — count of pending future appointments */
router.get("/dashboard/upcoming-appointments", requirePermission("dashboard", "view"), async (_req, res): Promise<void> => {
  try {
    const now = new Date();
    const rows = await db.select({ count: sql<number>`count(*)` })
      .from(appointmentsTable)
      .where(and(gt(appointmentsTable.scheduledAt, now), eq(appointmentsTable.status, "pending")));
    res.json({ count: Number(rows[0].count) });
  } catch {
    res.status(500).json({ error: "Failed to load appointments" });
  }
});

export default router;
