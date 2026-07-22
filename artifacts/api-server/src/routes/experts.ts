import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { expertsTable } from "@workspace/db";
import { GetExpertParams } from "@workspace/api-zod";

const router = Router();

function formatExpert(e: typeof expertsTable.$inferSelect) {
  return {
    id: e.id, name: e.name, title: e.title, bio: e.bio,
    avatar: e.avatar, specializations: e.specializations,
    rating: Number(e.rating), sessionCount: e.sessionCount,
    yearsExperience: e.yearsExperience,
  };
}

router.get("/experts", async (req, res): Promise<void> => {
  const rows = await db.select().from(expertsTable);
  res.json(rows.map(formatExpert));
});

router.get("/experts/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = GetExpertParams.safeParse({ id: parseInt(raw, 10) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const rows = await db.select().from(expertsTable).where(eq(expertsTable.id, parsed.data.id)).limit(1);
  if (!rows[0]) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatExpert(rows[0]));
});

export default router;
