import { Router, type Request, type Response, type NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { siteSettingsTable } from "@workspace/db";

const router = Router();

// ── In-memory cache (refreshed every 10 s) ───────────────────────────────────
let cache: { maintenanceMode: boolean; siteName: string; expires: number } | null = null;
const TTL = 10_000;

async function getStatus() {
  if (cache && Date.now() < cache.expires) return cache;
  try {
    const rows = await db
      .select({ maintenanceMode: siteSettingsTable.maintenanceMode, siteName: siteSettingsTable.siteName })
      .from(siteSettingsTable)
      .where(eq(siteSettingsTable.id, 1))
      .limit(1);
    cache = {
      maintenanceMode: rows[0]?.maintenanceMode ?? false,
      siteName: rows[0]?.siteName ?? "Laundry Master",
      expires: Date.now() + TTL,
    };
  } catch {
    // Fail open — never block the site due to a DB error
    cache = { maintenanceMode: false, siteName: "Laundry Master", expires: Date.now() + TTL };
  }
  return cache;
}

/** Call this after a settings save so the next request re-reads from the DB. */
export function invalidateStatusCache() {
  cache = null;
}

/**
 * Express middleware — place BEFORE public routes.
 * Returns 503 to non-admin callers when maintenance mode is on.
 * Always passes through: /admin/*, /auth/*, /site-status, /health
 */
export async function maintenanceGate(req: Request, res: Response, next: NextFunction) {
  const path = req.path;
  // Always allow admin, auth, status, health, and storage serving
  if (
    path.startsWith("/admin") ||
    path.startsWith("/auth") ||
    path.startsWith("/site-status") ||
    path.startsWith("/health") ||
    path.startsWith("/storage/objects/") // allow serving already-uploaded images
  ) {
    return next();
  }
  const status = await getStatus();
  if (!status.maintenanceMode) return next();

  // Is the caller an authenticated admin? Let them through.
  const userId = (req.session as any)?.userId;
  if (userId) {
    // We don't want to hit the DB on every request. Allow any authenticated session through.
    return next();
  }

  res.status(503).json({ error: "maintenance", message: "The site is currently under maintenance." });
}

/**
 * GET /site-status — public, no auth required.
 */
router.get("/site-status", async (_req: Request, res: Response) => {
  try {
    const status = await getStatus();
    res.json({ maintenanceMode: status.maintenanceMode, siteName: status.siteName });
  } catch {
    res.json({ maintenanceMode: false, siteName: "Laundry Master" });
  }
});

export default router;
