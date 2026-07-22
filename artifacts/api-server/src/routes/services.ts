import { Router } from "express";
import { db } from "@workspace/db";
import { servicesTable } from "@workspace/db";

const router = Router();

router.get("/services", async (req, res): Promise<void> => {
  const rows = await db.select().from(servicesTable);
  res.json(rows.map(s => ({
    id: s.id, name: s.name, description: s.description,
    duration: s.duration, price: Number(s.price),
    currency: s.currency, icon: s.icon, category: s.category,
  })));
});

export default router;
