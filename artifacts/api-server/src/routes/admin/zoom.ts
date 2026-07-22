import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { zoomMeetingsTable } from "@workspace/db";
import { requirePermission } from "../../middleware/requirePermission";
import { logAudit } from "../../lib/audit";

const router = Router();

router.get("/zoom", requirePermission("zoom", "view"), async (req, res): Promise<void> => {
  try {
    const rows = await db.select().from(zoomMeetingsTable).orderBy(desc(zoomMeetingsTable.createdAt));
    res.json(rows);
  } catch { res.status(500).json({ error: "Failed" }); }
});

router.get("/zoom/:id", requirePermission("zoom", "view"), async (req, res): Promise<void> => {
  try {
    const rows = await db.select().from(zoomMeetingsTable).where(eq(zoomMeetingsTable.id, parseInt(req.params.id as string))).limit(1);
    if (!rows[0]) { res.status(404).json({ error: "Not found" }); return; }
    res.json(rows[0]);
  } catch { res.status(500).json({ error: "Failed" }); }
});

router.post("/zoom", requirePermission("zoom", "create"), async (req, res): Promise<void> => {
  try {
    const { title, hostEmail, joinUrl, startTime, duration, status, relatedType, relatedId } = req.body;
    const [row] = await db.insert(zoomMeetingsTable).values({
      title, hostEmail, joinUrl, duration, status,
      startTime: startTime ? new Date(startTime) : null,
      relatedType, relatedId,
    }).returning();
    await logAudit(req, "create", "zoom", row.id);
    res.status(201).json(row);
  } catch { res.status(500).json({ error: "Failed to create meeting" }); }
});

router.put("/zoom/:id", requirePermission("zoom", "edit"), async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    const { title, hostEmail, joinUrl, startTime, duration, status, relatedType, relatedId } = req.body;
    const upd: Record<string, unknown> = {};
    if (title !== undefined) upd.title = title;
    if (hostEmail !== undefined) upd.hostEmail = hostEmail;
    if (joinUrl !== undefined) upd.joinUrl = joinUrl;
    if (startTime !== undefined) upd.startTime = new Date(startTime);
    if (duration !== undefined) upd.duration = duration;
    if (status !== undefined) upd.status = status;
    if (relatedType !== undefined) upd.relatedType = relatedType;
    if (relatedId !== undefined) upd.relatedId = relatedId;
    const [row] = await db.update(zoomMeetingsTable).set(upd).where(eq(zoomMeetingsTable.id, id)).returning();
    await logAudit(req, "update", "zoom", id);
    res.json(row);
  } catch { res.status(500).json({ error: "Failed to update meeting" }); }
});

router.delete("/zoom/:id", requirePermission("zoom", "delete"), async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    await db.delete(zoomMeetingsTable).where(eq(zoomMeetingsTable.id, id));
    await logAudit(req, "delete", "zoom", id);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Failed to delete meeting" }); }
});

export default router;
