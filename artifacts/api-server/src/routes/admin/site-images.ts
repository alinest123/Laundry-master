import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { siteImagesTable } from "@workspace/db";
import { requirePermission } from "../../middleware/requirePermission";
import { logAudit } from "../../lib/audit";

const router = Router();

/** GET /admin/site-images — list all image slots */
router.get("/site-images", requirePermission("settings", "view"), async (req, res): Promise<void> => {
  try {
    const rows = await db.select().from(siteImagesTable).orderBy(siteImagesTable.section, siteImagesTable.label);
    res.json(rows);
  } catch {
    res.status(500).json({ error: "Failed to load site images" });
  }
});

/** PUT /admin/site-images/:key — update one image slot */
router.put("/site-images/:key", requirePermission("settings", "edit"), async (req, res): Promise<void> => {
  const key = String(req.params["key"]);
  const { url } = req.body as { url?: string };
  if (url === undefined) { res.status(400).json({ error: "url is required" }); return; }
  try {
    const existing = await db.select({ id: siteImagesTable.id }).from(siteImagesTable)
      .where(eq(siteImagesTable.key, key)).limit(1);
    if (!existing[0]) { res.status(404).json({ error: "Image slot not found" }); return; }
    const [row] = await db.update(siteImagesTable).set({ url }).where(eq(siteImagesTable.key, key)).returning();
    await logAudit(req, "update", "settings", 0, { image_key: key, url });
    res.json(row);
  } catch {
    res.status(500).json({ error: "Failed to update image" });
  }
});

export default router;
