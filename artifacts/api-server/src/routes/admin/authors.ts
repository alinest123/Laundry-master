import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { authorsTable } from "@workspace/db";

const router = Router();

router.get("/admin/authors", async (req, res): Promise<void> => {
  try {
    const rows = await db.select().from(authorsTable).orderBy(desc(authorsTable.createdAt));
    res.json(rows);
  } catch { res.status(500).json({ error: "Failed to list authors" }); }
});

router.get("/admin/authors/:id", async (req, res): Promise<void> => {
  try {
    const rows = await db.select().from(authorsTable).where(eq(authorsTable.id, parseInt(req.params.id))).limit(1);
    if (!rows[0]) { res.status(404).json({ error: "Not found" }); return; }
    res.json(rows[0]);
  } catch { res.status(500).json({ error: "Failed to fetch author" }); }
});

router.post("/admin/authors", async (req, res): Promise<void> => {
  try {
    const { name, bio, avatar, role, email, twitter, linkedin, expertise } = req.body;
    const [author] = await db.insert(authorsTable).values({
      name, bio: bio ?? null, avatar: avatar ?? null, role: role ?? "Author",
      email: email ?? null, twitter: twitter ?? null, linkedin: linkedin ?? null,
      expertise: expertise ?? null,
    }).returning();
    res.status(201).json(author);
  } catch { res.status(500).json({ error: "Failed to create author" }); }
});

router.put("/admin/authors/:id", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { name, bio, avatar, role, email, twitter, linkedin, expertise } = req.body;
    const upd: Record<string, unknown> = {};
    if (name !== undefined) upd.name = name;
    if (bio !== undefined) upd.bio = bio;
    if (avatar !== undefined) upd.avatar = avatar;
    if (role !== undefined) upd.role = role;
    if (email !== undefined) upd.email = email;
    if (twitter !== undefined) upd.twitter = twitter;
    if (linkedin !== undefined) upd.linkedin = linkedin;
    if (expertise !== undefined) upd.expertise = expertise;
    const [author] = await db.update(authorsTable).set(upd).where(eq(authorsTable.id, id)).returning();
    if (!author) { res.status(404).json({ error: "Not found" }); return; }
    res.json(author);
  } catch { res.status(500).json({ error: "Failed to update author" }); }
});

router.delete("/admin/authors/:id", async (req, res): Promise<void> => {
  try {
    await db.delete(authorsTable).where(eq(authorsTable.id, parseInt(req.params.id)));
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Failed to delete author" }); }
});

export default router;
