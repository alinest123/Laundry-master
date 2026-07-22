import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { mediaLibraryTable } from "@workspace/db";
import { requirePermission } from "../../middleware/requirePermission";
import { logAudit } from "../../lib/audit";

const router = Router();

router.get("/media", requirePermission("media", "view"), async (req, res): Promise<void> => {
  try {
    const { page = "1", limit = "40" } = req.query as Record<string, string>;
    const p = Math.max(1, parseInt(page)), l = Math.min(200, parseInt(limit));
    const rows = await db.select().from(mediaLibraryTable)
      .orderBy(desc(mediaLibraryTable.createdAt)).limit(l).offset((p - 1) * l);
    res.json({ media: rows, page: p, limit: l });
  } catch { res.status(500).json({ error: "Failed" }); }
});

router.post("/media", requirePermission("media", "create"), async (req, res): Promise<void> => {
  try {
    const { filename, originalName, mimeType, url, size, altText } = req.body;
    const [row] = await db.insert(mediaLibraryTable).values({
      filename, originalName, mimeType, url,
      size: size ?? 0, altText,
      uploadedBy: req.user?.id ?? null,
    }).returning();
    await logAudit(req, "create", "media", row.id);
    res.status(201).json(row);
  } catch { res.status(500).json({ error: "Failed to add media" }); }
});

router.delete("/media/:id", requirePermission("media", "delete"), async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    await db.delete(mediaLibraryTable).where(eq(mediaLibraryTable.id, id));
    await logAudit(req, "delete", "media", id);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Failed" }); }
});

export default router;
