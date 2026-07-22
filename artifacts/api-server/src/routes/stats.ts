import { Router } from "express";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { articlesTable, categoriesTable, expertsTable, appointmentsTable } from "@workspace/db";

const router = Router();

router.get("/stats", async (req, res): Promise<void> => {
  const [articles, categories, experts, consultations] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(articlesTable),
    db.select({ count: sql<number>`count(*)` }).from(categoriesTable),
    db.select({ count: sql<number>`count(*)` }).from(expertsTable),
    db.select({ count: sql<number>`count(*)` }).from(appointmentsTable),
  ]);

  res.json({
    totalArticles: Number(articles[0]?.count ?? 0),
    totalCategories: Number(categories[0]?.count ?? 0),
    totalExperts: Number(experts[0]?.count ?? 0),
    totalConsultations: Number(consultations[0]?.count ?? 0),
    totalReaders: 12847,
    countriesReached: 94,
  });
});

export default router;
