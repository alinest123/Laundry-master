import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { articleCommentsTable, articlesTable } from "@workspace/db";
import { requirePermission } from "../../middleware/requirePermission";

const router = Router();

/** GET /api/admin/comments — list all comments with optional status filter */
router.get(
  "/comments",
  requirePermission("articles", "view"),
  async (req, res): Promise<void> => {
    try {
      const status = req.query["status"];
      const rows = await db
        .select({
          id: articleCommentsTable.id,
          articleId: articleCommentsTable.articleId,
          authorName: articleCommentsTable.authorName,
          authorEmail: articleCommentsTable.authorEmail,
          content: articleCommentsTable.content,
          isApproved: articleCommentsTable.isApproved,
          createdAt: articleCommentsTable.createdAt,
          articleTitle: articlesTable.title,
          articleSlug: articlesTable.slug,
        })
        .from(articleCommentsTable)
        .leftJoin(articlesTable, eq(articleCommentsTable.articleId, articlesTable.id))
        .orderBy(desc(articleCommentsTable.createdAt));

      const filtered =
        status === "pending"
          ? rows.filter((r) => r.isApproved === 0)
          : status === "approved"
          ? rows.filter((r) => r.isApproved === 1)
          : status === "rejected"
          ? rows.filter((r) => r.isApproved === -1)
          : rows;

      res.json(
        filtered.map((r) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
        }))
      );
    } catch {
      res.status(500).json({ error: "Failed to load comments" });
    }
  }
);

/** PATCH /api/admin/comments/:id/approve */
router.patch(
  "/comments/:id/approve",
  requirePermission("articles", "edit"),
  async (req, res): Promise<void> => {
    const id = Number(req.params["id"]);
    try {
      await db
        .update(articleCommentsTable)
        .set({ isApproved: 1 })
        .where(eq(articleCommentsTable.id, id));
      res.json({ ok: true });
    } catch {
      res.status(500).json({ error: "Failed to approve comment" });
    }
  }
);

/** PATCH /api/admin/comments/:id/disapprove */
router.patch(
  "/comments/:id/disapprove",
  requirePermission("articles", "edit"),
  async (req, res): Promise<void> => {
    const id = Number(req.params["id"]);
    try {
      await db
        .update(articleCommentsTable)
        .set({ isApproved: -1 })
        .where(eq(articleCommentsTable.id, id));
      res.json({ ok: true });
    } catch {
      res.status(500).json({ error: "Failed to disapprove comment" });
    }
  }
);

/** DELETE /api/admin/comments/:id */
router.delete(
  "/comments/:id",
  requirePermission("articles", "edit"),
  async (req, res): Promise<void> => {
    const id = Number(req.params["id"]);
    try {
      await db
        .delete(articleCommentsTable)
        .where(eq(articleCommentsTable.id, id));
      res.json({ ok: true });
    } catch {
      res.status(500).json({ error: "Failed to delete comment" });
    }
  }
);

export default router;
