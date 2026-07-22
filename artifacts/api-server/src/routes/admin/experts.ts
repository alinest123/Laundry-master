import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { expertsTable } from "@workspace/db";
import { requirePermission } from "../../middleware/requirePermission";
import { logAudit } from "../../lib/audit";

const router = Router();

router.get("/experts", requirePermission("experts", "view"), async (req, res): Promise<void> => {
  try {
    const rows = await db.select().from(expertsTable).orderBy(desc(expertsTable.createdAt));
    res.json(rows);
  } catch { res.status(500).json({ error: "Failed" }); }
});

router.get("/experts/:id", requirePermission("experts", "view"), async (req, res): Promise<void> => {
  try {
    const rows = await db.select().from(expertsTable).where(eq(expertsTable.id, parseInt(req.params.id as string))).limit(1);
    if (!rows[0]) { res.status(404).json({ error: "Not found" }); return; }
    res.json(rows[0]);
  } catch { res.status(500).json({ error: "Failed" }); }
});

router.post("/experts", requirePermission("experts", "create"), async (req, res): Promise<void> => {
  try {
    const { name, title, bio, avatar, specializations, rating, sessionCount, yearsExperience } = req.body;
    const [row] = await db.insert(expertsTable).values({
      name, title, bio, avatar,
      specializations: Array.isArray(specializations) ? specializations : [],
      rating: rating ?? "4.8",
      sessionCount: sessionCount ?? 0,
      yearsExperience: yearsExperience ?? 10,
    }).returning();
    await logAudit(req, "create", "experts", row.id);
    res.status(201).json(row);
  } catch { res.status(500).json({ error: "Failed to create expert" }); }
});

router.put("/experts/:id", requirePermission("experts", "edit"), async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    const { name, title, bio, avatar, specializations, rating, sessionCount, yearsExperience } = req.body;
    const upd: Record<string, unknown> = {};
    if (name !== undefined) upd.name = name;
    if (title !== undefined) upd.title = title;
    if (bio !== undefined) upd.bio = bio;
    if (avatar !== undefined) upd.avatar = avatar;
    if (specializations !== undefined) upd.specializations = specializations;
    if (rating !== undefined) upd.rating = rating;
    if (sessionCount !== undefined) upd.sessionCount = sessionCount;
    if (yearsExperience !== undefined) upd.yearsExperience = yearsExperience;
    const [row] = await db.update(expertsTable).set(upd).where(eq(expertsTable.id, id)).returning();
    await logAudit(req, "update", "experts", id);
    res.json(row);
  } catch { res.status(500).json({ error: "Failed to update expert" }); }
});

router.delete("/experts/:id", requirePermission("experts", "delete"), async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    await db.delete(expertsTable).where(eq(expertsTable.id, id));
    await logAudit(req, "delete", "experts", id);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Failed" }); }
});

export default router;
