import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  usersTable, appointmentsTable, servicesTable, expertsTable,
  paymentsTable, savedArticlesTable, articlesTable, zoomMeetingsTable,
} from "@workspace/db";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

// All /user/* routes require authentication — scoped to avoid blocking public routes
router.use("/user", requireAuth);

// ── Profile ──────────────────────────────────────────────────────────────────

// GET /api/user/profile
router.get("/user/profile", async (req, res): Promise<void> => {
  try {
    const rows = await db.select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      role: usersTable.role,
      avatarUrl: usersTable.avatarUrl,
      bio: usersTable.bio,
      phone: usersTable.phone,
      newsletterEnabled: usersTable.newsletterEnabled,
      newsletterTopics: usersTable.newsletterTopics,
      twoFaEnabled: usersTable.twoFaEnabled,
      createdAt: usersTable.createdAt,
    }).from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1);

    if (!rows[0]) { res.status(404).json({ error: "User not found" }); return; }
    res.json(rows[0]);
  } catch (err) {
    console.error("[user/profile GET]", err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// PATCH /api/user/profile
router.patch("/user/profile", async (req, res): Promise<void> => {
  const { name, phone, bio, avatarUrl } = req.body ?? {};
  try {
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = String(name).trim();
    if (phone !== undefined) updates.phone = phone ? String(phone).trim() : null;
    if (bio !== undefined) updates.bio = bio ? String(bio).trim() : null;
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl ? String(avatarUrl).trim() : null;

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: "No fields to update" }); return;
    }

    await db.update(usersTable).set(updates).where(eq(usersTable.id, req.user!.id));
    res.json({ ok: true });
  } catch (err) {
    console.error("[user/profile PATCH]", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// ── Appointments ─────────────────────────────────────────────────────────────

async function formatAppointment(a: typeof appointmentsTable.$inferSelect) {
  const [serviceRows, expertRows] = await Promise.all([
    db.select().from(servicesTable).where(eq(servicesTable.id, a.serviceId)).limit(1),
    db.select().from(expertsTable).where(eq(expertsTable.id, a.expertId)).limit(1),
  ]);
  const s = serviceRows[0];
  const e = expertRows[0];
  return {
    id: a.id, status: a.status,
    scheduledAt: a.scheduledAt.toISOString(),
    timezone: a.timezone, notes: a.notes, zoomLink: a.zoomLink,
    userEmail: a.userEmail, userName: a.userName,
    createdAt: a.createdAt.toISOString(),
    service: s ? { id: s.id, name: s.name, description: s.description, duration: s.duration, price: Number(s.price), currency: s.currency } : null,
    expert: e ? { id: e.id, name: e.name, title: e.title, avatar: e.avatar } : null,
  };
}

// GET /api/user/appointments
router.get("/user/appointments", async (req, res): Promise<void> => {
  try {
    const rows = await db.select().from(appointmentsTable)
      .where(eq(appointmentsTable.userEmail, req.user!.email));
    const result = await Promise.all(rows.map(formatAppointment));
    res.json(result);
  } catch (err) {
    console.error("[user/appointments]", err);
    res.status(500).json({ error: "Failed to fetch appointments" });
  }
});

// ── Zoom Meetings ─────────────────────────────────────────────────────────────

// GET /api/user/zoom-meetings
// Returns appointments that have a zoomLink (the guest-facing zoom data)
// plus any zoomMeetings rows where hostEmail matches the user
router.get("/user/zoom-meetings", async (req, res): Promise<void> => {
  try {
    // Appointments with zoom links for this user
    const apptRows = await db.select().from(appointmentsTable)
      .where(and(
        eq(appointmentsTable.userEmail, req.user!.email),
      ));
    const withZoom = apptRows.filter(a => !!a.zoomLink);
    const formatted = await Promise.all(withZoom.map(formatAppointment));

    // Also include any standalone zoom meetings where hostEmail = user's email
    const meetingRows = await db.select().from(zoomMeetingsTable)
      .where(eq(zoomMeetingsTable.hostEmail, req.user!.email));

    res.json({ appointments: formatted, meetings: meetingRows });
  } catch (err) {
    console.error("[user/zoom-meetings]", err);
    res.status(500).json({ error: "Failed to fetch zoom meetings" });
  }
});

// ── Invoices ──────────────────────────────────────────────────────────────────

// GET /api/user/invoices
router.get("/user/invoices", async (req, res): Promise<void> => {
  try {
    const rows = await db.select().from(paymentsTable)
      .where(eq(paymentsTable.userId, req.user!.id));
    res.json(rows.map(p => ({
      id: p.id, amount: p.amount, currency: p.currency,
      status: p.status, provider: p.provider, description: p.description,
      providerRef: p.providerRef, createdAt: p.createdAt.toISOString(),
    })));
  } catch (err) {
    console.error("[user/invoices]", err);
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

// ── Newsletter ────────────────────────────────────────────────────────────────

// GET /api/user/newsletter
router.get("/user/newsletter", async (req, res): Promise<void> => {
  try {
    const rows = await db.select({
      newsletterEnabled: usersTable.newsletterEnabled,
      newsletterTopics: usersTable.newsletterTopics,
    }).from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1);
    if (!rows[0]) { res.status(404).json({ error: "User not found" }); return; }
    const { newsletterEnabled, newsletterTopics } = rows[0];
    let topics: string[] = [];
    try { topics = JSON.parse(newsletterTopics ?? "[]"); } catch { /* ignore */ }
    res.json({ newsletterEnabled, newsletterTopics: topics });
  } catch (err) {
    console.error("[user/newsletter GET]", err);
    res.status(500).json({ error: "Failed to fetch newsletter preferences" });
  }
});

// PATCH /api/user/newsletter
router.patch("/user/newsletter", async (req, res): Promise<void> => {
  const { newsletterEnabled, newsletterTopics } = req.body ?? {};
  try {
    const updates: Record<string, unknown> = {};
    if (newsletterEnabled !== undefined) updates.newsletterEnabled = Boolean(newsletterEnabled);
    if (newsletterTopics !== undefined && Array.isArray(newsletterTopics)) {
      updates.newsletterTopics = JSON.stringify(newsletterTopics);
    }
    if (Object.keys(updates).length === 0) { res.status(400).json({ error: "Nothing to update" }); return; }
    await db.update(usersTable).set(updates).where(eq(usersTable.id, req.user!.id));
    res.json({ ok: true });
  } catch (err) {
    console.error("[user/newsletter PATCH]", err);
    res.status(500).json({ error: "Failed to update newsletter preferences" });
  }
});

// ── Saved Articles ────────────────────────────────────────────────────────────

// GET /api/user/saved-articles
router.get("/user/saved-articles", async (req, res): Promise<void> => {
  try {
    const rows = await db
      .select({
        savedId: savedArticlesTable.id,
        savedAt: savedArticlesTable.savedAt,
        articleId: articlesTable.id,
        title: articlesTable.title,
        slug: articlesTable.slug,
        excerpt: articlesTable.excerpt,
        featuredImage: articlesTable.featuredImage,
        readingTime: articlesTable.readingTime,
      })
      .from(savedArticlesTable)
      .innerJoin(articlesTable, eq(savedArticlesTable.articleId, articlesTable.id))
      .where(eq(savedArticlesTable.userId, req.user!.id));

    res.json(rows.map(r => ({
      savedId: r.savedId,
      savedAt: r.savedAt.toISOString(),
      article: {
        id: r.articleId, title: r.title, slug: r.slug,
        excerpt: r.excerpt, featuredImage: r.featuredImage, readingTime: r.readingTime,
      },
    })));
  } catch (err) {
    console.error("[user/saved-articles GET]", err);
    res.status(500).json({ error: "Failed to fetch saved articles" });
  }
});

// GET /api/user/saved-article-ids — lightweight list of saved article IDs
router.get("/user/saved-article-ids", async (req, res): Promise<void> => {
  try {
    const rows = await db.select({ articleId: savedArticlesTable.articleId })
      .from(savedArticlesTable).where(eq(savedArticlesTable.userId, req.user!.id));
    res.json(rows.map(r => r.articleId));
  } catch (err) {
    console.error("[user/saved-article-ids]", err);
    res.status(500).json({ error: "Failed" });
  }
});

// POST /api/user/saved-articles/:articleId
router.post("/user/saved-articles/:articleId", async (req, res): Promise<void> => {
  const articleId = parseInt(req.params.articleId as string, 10);
  if (isNaN(articleId)) { res.status(400).json({ error: "Invalid article ID" }); return; }
  try {
    await db.insert(savedArticlesTable)
      .values({ userId: req.user!.id, articleId })
      .onConflictDoNothing();
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error("[user/saved-articles POST]", err);
    res.status(500).json({ error: "Failed to save article" });
  }
});

// DELETE /api/user/saved-articles/:articleId
router.delete("/user/saved-articles/:articleId", async (req, res): Promise<void> => {
  const articleId = parseInt(req.params.articleId as string, 10);
  if (isNaN(articleId)) { res.status(400).json({ error: "Invalid article ID" }); return; }
  try {
    await db.delete(savedArticlesTable)
      .where(and(
        eq(savedArticlesTable.userId, req.user!.id),
        eq(savedArticlesTable.articleId, articleId),
      ));
    res.json({ ok: true });
  } catch (err) {
    console.error("[user/saved-articles DELETE]", err);
    res.status(500).json({ error: "Failed to remove saved article" });
  }
});

export default router;
