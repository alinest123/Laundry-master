import { Router } from "express";
import { db } from "@workspace/db";
import { siteImagesTable } from "@workspace/db";

const router = Router();

let cache: Record<string, string> | null = null;
let cacheExpires = 0;
const TTL = 60_000; // 1 minute

export function invalidateSiteImagesCache() {
  cache = null;
}

/** GET /api/site-images — public, returns key→url map */
router.get("/site-images", async (_req, res) => {
  try {
    if (cache && Date.now() < cacheExpires) { res.json(cache); return; }
    const rows = await db.select({ key: siteImagesTable.key, url: siteImagesTable.url }).from(siteImagesTable);
    cache = Object.fromEntries(rows.map(r => [r.key, r.url]));
    cacheExpires = Date.now() + TTL;
    res.json(cache);
  } catch {
    res.json({});
  }
});

export default router;
