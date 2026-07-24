import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "@workspace/db";
import { pageContentTable } from "@workspace/db";
import { requirePermission } from "../../middleware/requirePermission";
import { logAudit } from "../../lib/audit";
import { PAGE_DEFAULTS } from "../page-content";

const router = Router();

/**
 * GET /admin/page-content/:page
 * Returns effective values (defaults merged with saved overrides) so the
 * admin editor is always prefilled with the current visible content.
 */
router.get(
  "/page-content/:page",
  requirePermission("settings", "view"),
  async (req, res): Promise<void> => {
    const page = String(req.params["page"]);
    try {
      const defaults = PAGE_DEFAULTS[page] ?? {};
      const rows = await db
        .select()
        .from(pageContentTable)
        .where(eq(pageContentTable.page, page));
      const saved: Record<string, string> = {};
      for (const row of rows) saved[row.fieldKey] = row.value;
      res.json({ ...defaults, ...saved });
    } catch {
      res.status(500).json({ error: "Failed to load page content" });
    }
  }
);

/**
 * PUT /admin/page-content/:page
 * Upserts every field in the request body for the given page.
 */
router.put(
  "/page-content/:page",
  requirePermission("settings", "edit"),
  async (req, res): Promise<void> => {
    const page = String(req.params["page"]);
    try {
      const fields = req.body as Record<string, string>;
      if (!fields || typeof fields !== "object" || Array.isArray(fields)) {
        res.status(400).json({ error: "Body must be a key-value object" });
        return;
      }
      for (const [fieldKey, value] of Object.entries(fields)) {
        if (typeof value !== "string") continue;
        const pageStr: string = page;
        const existing = await db
          .select({ id: pageContentTable.id })
          .from(pageContentTable)
          .where(
            and(
              eq(pageContentTable.page, pageStr),
              eq(pageContentTable.fieldKey, fieldKey)
            )
          )
          .limit(1);
        if (existing[0]) {
          await db
            .update(pageContentTable)
            .set({ value })
            .where(eq(pageContentTable.id, existing[0].id));
        } else {
          await db.insert(pageContentTable).values({
            page: pageStr,
            fieldKey,
            value,
          });
        }
      }
      await logAudit(req, "update", "page_content" as any, 0, {
        page,
        keys: Object.keys(fields),
      });
      res.json({ ok: true });
    } catch {
      res.status(500).json({ error: "Failed to save page content" });
    }
  }
);

export default router;
