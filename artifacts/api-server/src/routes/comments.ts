import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "@workspace/db";
import { articleCommentsTable, articlesTable } from "@workspace/db";

const router = Router();

/** GET /api/articles/:slug/comments — public, only approved comments */
router.get("/articles/:slug/comments", async (req, res): Promise<void> => {
  const slug = String(req.params["slug"]);
  try {
    const article = await db
      .select({ id: articlesTable.id })
      .from(articlesTable)
      .where(eq(articlesTable.slug, slug))
      .limit(1);
    if (!article[0]) {
      res.json([]);
      return;
    }
    const comments = await db
      .select()
      .from(articleCommentsTable)
      .where(
        and(
          eq(articleCommentsTable.articleId, article[0].id),
          eq(articleCommentsTable.isApproved, 1)
        )
      )
      .orderBy(articleCommentsTable.createdAt);
    res.json(
      comments.map((c) => ({
        id: c.id,
        authorName: c.authorName,
        content: c.content,
        createdAt: c.createdAt.toISOString(),
      }))
    );
  } catch {
    res.status(500).json({ error: "Failed to load comments" });
  }
});

/** POST /api/articles/:slug/comments — submit a comment (pending approval) */
router.post("/articles/:slug/comments", async (req, res): Promise<void> => {
  const slug = String(req.params["slug"]);
  const { authorName, authorEmail, content } = req.body ?? {};

  if (!authorName?.trim() || !authorEmail?.trim() || !content?.trim()) {
    res.status(400).json({ error: "Name, email, and comment are required." });
    return;
  }
  if (content.length > 2000) {
    res.status(400).json({ error: "Comment is too long (max 2000 characters)." });
    return;
  }

  try {
    const article = await db
      .select({ id: articlesTable.id })
      .from(articlesTable)
      .where(eq(articlesTable.slug, slug))
      .limit(1);
    if (!article[0]) {
      res.status(404).json({ error: "Article not found." });
      return;
    }
    await db.insert(articleCommentsTable).values({
      articleId: article[0].id,
      authorName: authorName.trim(),
      authorEmail: authorEmail.trim(),
      content: content.trim(),
      isApproved: 0,
    });
    res.status(201).json({ ok: true, message: "Your comment is awaiting moderation." });
  } catch {
    res.status(500).json({ error: "Failed to submit comment" });
  }
});

export default router;
