import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { appointmentsTable, servicesTable, expertsTable } from "@workspace/db";
import { CreateAppointmentBody, GetAppointmentParams } from "@workspace/api-zod";

const router = Router();

async function formatAppointment(a: typeof appointmentsTable.$inferSelect) {
  const [service, expert] = await Promise.all([
    db.select().from(servicesTable).where(eq(servicesTable.id, a.serviceId)).limit(1),
    db.select().from(expertsTable).where(eq(expertsTable.id, a.expertId)).limit(1),
  ]);
  return {
    id: a.id, status: a.status,
    scheduledAt: a.scheduledAt.toISOString(),
    timezone: a.timezone, notes: a.notes, zoomLink: a.zoomLink,
    userEmail: a.userEmail, userName: a.userName,
    createdAt: a.createdAt.toISOString(),
    service: service[0] ? { id: service[0].id, name: service[0].name, description: service[0].description, duration: service[0].duration, price: Number(service[0].price), currency: service[0].currency, icon: service[0].icon, category: service[0].category } : null,
    expert: expert[0] ? { id: expert[0].id, name: expert[0].name, title: expert[0].title, bio: expert[0].bio, avatar: expert[0].avatar, specializations: expert[0].specializations, rating: Number(expert[0].rating), sessionCount: expert[0].sessionCount, yearsExperience: expert[0].yearsExperience } : null,
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
