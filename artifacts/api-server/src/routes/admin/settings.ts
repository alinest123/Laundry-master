import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { siteSettingsTable } from "@workspace/db";
import { requirePermission } from "../../middleware/requirePermission";
import { logAudit } from "../../lib/audit";

const router = Router();

router.get("/settings", requirePermission("settings", "view"), async (req, res): Promise<void> => {
  try {
    const rows = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.id, 1)).limit(1);
    if (!rows[0]) {
      // Auto-create default row
      const [def] = await db.insert(siteSettingsTable).values({ id: 1 } as any).returning();
      res.json(def); return;
    }
    res.json(rows[0]);
  } catch { res.status(500).json({ error: "Failed" }); }
});

router.put("/settings", requirePermission("settings", "edit"), async (req, res): Promise<void> => {
  try {
    const { siteName, siteDescription, contactEmail, maintenanceMode, customHeadHtml, customBodyHtml, socialLinks } = req.body;
    const upd: Record<string, unknown> = {};
    if (siteName !== undefined) upd.siteName = siteName;
    if (siteDescription !== undefined) upd.siteDescription = siteDescription;
    if (contactEmail !== undefined) upd.contactEmail = contactEmail;
    if (maintenanceMode !== undefined) upd.maintenanceMode = maintenanceMode;
    if (customHeadHtml !== undefined) upd.customHeadHtml = customHeadHtml;
    if (customBodyHtml !== undefined) upd.customBodyHtml = customBodyHtml;
    if (socialLinks !== undefined) upd.socialLinks = typeof socialLinks === "string" ? socialLinks : JSON.stringify(socialLinks);
    // Upsert row id=1
    const existing = await db.select({ id: siteSettingsTable.id }).from(siteSettingsTable).where(eq(siteSettingsTable.id, 1)).limit(1);
    let row;
    if (existing[0]) {
      [row] = await db.update(siteSettingsTable).set(upd).where(eq(siteSettingsTable.id, 1)).returning();
    } else {
      [row] = await db.insert(siteSettingsTable).values({ id: 1, ...upd } as any).returning();
    }
    await logAudit(req, "update", "settings", 1, upd);
    res.json(row);
  } catch { res.status(500).json({ error: "Failed to save settings" }); }
});

export default router;
