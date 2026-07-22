import { Router } from "express";
import { db } from "@workspace/db";
import { tagsTable } from "@workspace/db";

const router = Router();

router.get("/tags", async (req, res): Promise<void> => {
  const tags = await db.select().from(tagsTable);
  res.json(tags.map(t => ({ id: t.id, name: t.name, slug: t.slug, articleCount: t.articleCount })));
});

export default router;
