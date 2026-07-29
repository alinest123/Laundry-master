import { and, lte, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { articlesTable } from "@workspace/db";
import { logger } from "./logger";

export async function publishDueArticles(): Promise<{ count: number; ids: number[] }> {
  try {
    const now = new Date();
    const published = await db
      .update(articlesTable)
      .set({ status: "published", publishedAt: now })
      .where(
        and(
          eq(articlesTable.status, "scheduled"),
          lte(articlesTable.scheduledAt, now)
        )
      )
      .returning({ id: articlesTable.id, title: articlesTable.title });

    if (published.length > 0) {
      logger.info(
        { count: published.length, ids: published.map((r) => r.id) },
        "Scheduled articles auto-published"
      );
    }

    return { count: published.length, ids: published.map((r) => r.id) };
  } catch (err) {
    logger.error({ err }, "Scheduler: failed to publish scheduled articles");
    return { count: 0, ids: [] };
  }
}

export function startScheduler(): NodeJS.Timeout {
  // Fire once on startup to catch any that were missed while the server was down
  publishDueArticles();
  const handle = setInterval(publishDueArticles, 60_000);
  logger.info("Article scheduler started — checking every 60 s");
  return handle;
}
