import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { editorialDocumentsTable } from "@workspace/db";
import { requirePermission } from "../../middleware/requirePermission";

const router = Router();

router.get("/admin/editorial-documents", requirePermission("settings", "view"), async (req, res): Promise<void> => {
  try {
    const docs = await db.select().from(editorialDocumentsTable);
    res.json(docs);
  } catch { res.status(500).json({ error: "Failed to list editorial documents" }); }
});

router.get("/admin/editorial-documents/:slug", requirePermission("settings", "view"), async (req, res): Promise<void> => {
  try {
    const [doc] = await db.select().from(editorialDocumentsTable).where(eq(editorialDocumentsTable.slug, req.params["slug"] as string)).limit(1);
    if (!doc) { res.status(404).json({ error: "Not found" }); return; }
    res.json(doc);
  } catch { res.status(500).json({ error: "Failed to fetch document" }); }
});

router.post("/admin/editorial-documents", requirePermission("settings", "edit"), async (req, res): Promise<void> => {
  try {
    const { slug, title, content, docType, version, effectiveDate, docNumber, status, approvedBy } = req.body;
    const [doc] = await db.insert(editorialDocumentsTable).values({
      slug, title, content: content ?? "", docType, version: version ?? "1.0",
      effectiveDate: effectiveDate ?? null, docNumber: docNumber ?? null,
      status: status ?? "draft", approvedBy: approvedBy ?? null,
    }).returning();
    res.status(201).json(doc);
  } catch (err: any) {
    if (err?.code === "23505") res.status(409).json({ error: "Slug already exists" });
    else res.status(500).json({ error: "Failed to create document" });
  }
});

router.put("/admin/editorial-documents/:slug", requirePermission("settings", "edit"), async (req, res): Promise<void> => {
  try {
    const { title, content, docType, version, effectiveDate, docNumber, status, approvedBy } = req.body;
    const [doc] = await db.update(editorialDocumentsTable).set({
      title, content, docType, version, effectiveDate: effectiveDate ?? null,
      docNumber: docNumber ?? null, status, approvedBy: approvedBy ?? null,
    }).where(eq(editorialDocumentsTable.slug, req.params["slug"] as string)).returning();
    if (!doc) { res.status(404).json({ error: "Not found" }); return; }
    res.json(doc);
  } catch { res.status(500).json({ error: "Failed to update document" }); }
});

// Public endpoint
router.get("/editorial/:slug", async (req, res): Promise<void> => {
  try {
    const [doc] = await db.select().from(editorialDocumentsTable)
      .where(eq(editorialDocumentsTable.slug, req.params["slug"] as string)).limit(1);
    if (!doc || doc.status !== "active") { res.status(404).json({ error: "Not found" }); return; }
    res.json(doc);
  } catch { res.status(500).json({ error: "Failed to fetch document" }); }
});

export default router;
