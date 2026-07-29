import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { appointmentsTable, servicesTable, expertsTable } from "@workspace/db";
import { CreateAppointmentBody, GetAppointmentParams } from "@workspace/api-zod";

const router = Router();

async function formatAppointment(a: typeof appointmentsTable.$inferSelect) {
  const [serviceRows, expertRows] = await Promise.all([
    a.serviceId != null ? db.select().from(servicesTable).where(eq(servicesTable.id, a.serviceId)).limit(1) : Promise.resolve([]),
    a.expertId != null ? db.select().from(expertsTable).where(eq(expertsTable.id, a.expertId)).limit(1) : Promise.resolve([]),
  ]);
  const service = serviceRows[0];
  const expert = expertRows[0];
  return {
    id: a.id, status: a.status,
    scheduledAt: a.scheduledAt.toISOString(),
    scheduledEnd: a.scheduledEnd?.toISOString() ?? null,
    calBookingUid: a.calBookingUid ?? null,
    timezone: a.timezone, notes: a.notes, zoomLink: a.zoomLink,
    userEmail: a.userEmail, userName: a.userName,
    createdAt: a.createdAt.toISOString(),
    service: service ? { id: service.id, name: service.name, description: service.description, duration: service.duration, price: Number(service.price), currency: service.currency, icon: service.icon, category: service.category } : null,
    expert: expert ? { id: expert.id, name: expert.name, title: expert.title, bio: expert.bio, avatar: expert.avatar, specializations: expert.specializations, rating: Number(expert.rating), sessionCount: expert.sessionCount, yearsExperience: expert.yearsExperience } : null,
  };
}

router.get("/appointments", async (req, res): Promise<void> => {
  const rows = await db.select().from(appointmentsTable);
  const result = await Promise.all(rows.map(formatAppointment));
  res.json(result);
});

router.post("/appointments", async (req, res): Promise<void> => {
  const parsed = CreateAppointmentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { serviceId, expertId, scheduledAt, timezone, notes, userEmail, userName } = parsed.data;
  const inserted = await db.insert(appointmentsTable).values({
    serviceId, expertId,
    scheduledAt: new Date(scheduledAt),
    timezone: timezone ?? "UTC",
    notes, userEmail, userName,
    status: "pending",
  }).returning();

  const result = await formatAppointment(inserted[0]);
  res.status(201).json(result);
});

router.get("/appointments/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = GetAppointmentParams.safeParse({ id: parseInt(raw, 10) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const rows = await db.select().from(appointmentsTable).where(eq(appointmentsTable.id, parsed.data.id)).limit(1);
  if (!rows[0]) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await formatAppointment(rows[0]));
});

export default router;
