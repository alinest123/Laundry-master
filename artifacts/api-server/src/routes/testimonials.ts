import { Router } from "express";
import { db } from "@workspace/db";
import { testimonialsTable } from "@workspace/db";
import { ListTestimonialsQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/testimonials", async (req, res): Promise<void> => {
  const parsed = ListTestimonialsQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 6) : 6;
  const rows = await db.select().from(testimonialsTable).limit(limit);
  res.json(rows.map(t => ({
    id: t.id, authorName: t.authorName, authorRole: t.authorRole,
    authorAvatar: t.authorAvatar, content: t.content, rating: t.rating,
  })));
});

export default router;
