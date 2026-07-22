import { Router } from "express";
import { eq, isNull, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { categoriesTable } from "@workspace/db";

const router = Router();

router.get("/admin/categories", async (req, res): Promise<void> => {
  try {
    const all = await db.select().from(categoriesTable).orderBy(categoriesTable.name);
    // Nest subcategories under parents
    const parents = all.filter(c => !c.parentId);
    const result = parents.map(p => ({
      ...p,
      subcategories: all.filter(c => c.parentId === p.id),
    }));
    res.json(result);
  } catch { res.status(500).json({ error: "Failed to list categories" }); }
});

router.get("/admin/categories/flat", async (req, res): Promise<void> => {
  try {
    const rows = await db.select().from(categoriesTable).orderBy(categoriesTable.name);
    res.json(rows);
  } catch { res.status(500).json({ error: "Failed to list categories" }); }
});

router.post("/admin/categories", async (req, res): Promise<void> => {
  try {
    const { name, slug, description, featuredImage, parentId } = req.body;
    const [cat] = await db.insert(categoriesTable).values({
      name, slug, description: description ?? null,
      featuredImage: featuredImage ?? null, parentId: parentId ?? null,
    }).returning();
    res.status(201).json(cat);
  } catch (err: any) {
    if (err?.code === "23505") res.status(409).json({ error: "Slug already exists" });
    else res.status(500).json({ error: "Failed to create category" });
  }
});

router.put("/admin/categories/:id", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { name, slug, description, featuredImage, parentId } = req.body;
    const upd: Record<string, unknown> = {};
    if (name !== undefined) upd.name = name;
    if (slug !== undefined) upd.slug = slug;
    if (description !== undefined) upd.description = description;
    if (featuredImage !== undefined) upd.featuredImage = featuredImage;
    if (parentId !== undefined) upd.parentId = parentId ?? null;
    const [cat] = await db.update(categoriesTable).set(upd).where(eq(categoriesTable.id, id)).returning();
    if (!cat) { res.status(404).json({ error: "Not found" }); return; }
    res.json(cat);
  } catch (err: any) {
    if (err?.code === "23505") res.status(409).json({ error: "Slug already exists" });
    else res.status(500).json({ error: "Failed to update category" });
  }
});

router.delete("/admin/categories/:id", async (req, res): Promise<void> => {
  try {
    await db.delete(categoriesTable).where(eq(categoriesTable.id, parseInt(req.params.id)));
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Failed to delete category" }); }
});

export default router;
