import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth";

// Old routers — define their own /admin/* paths internally
import articlesRouter from "./articles";
import authorsRouter from "./authors";
import categoriesRouter from "./categories";
import tagsRouter from "./tags";

// New routers — define relative paths (no /admin prefix)
import usersRouter from "./users";
import fabricsRouter from "./fabrics";
import stainsRouter from "./stains";
import paymentsRouter from "./payments";
import zoomRouter from "./zoom";
import newsletterRouter from "./newsletter";
import mediaRouter from "./media";
import seoRouter from "./seo";
import redirectsRouter from "./redirects";
import settingsRouter from "./settings";
import securityLogsRouter from "./security-logs";
import auditLogsRouter from "./audit-logs";
import expertsRouter from "./experts";
import appointmentsRouter from "./appointments";
import pageContentRouter from "./page-content";

const router = Router();

// Apply auth to every /admin/* route
router.use("/admin", requireAuth);

// Old routers: already include /admin/* prefix in their route definitions
router.use(articlesRouter);
router.use(authorsRouter);
router.use(categoriesRouter);
router.use(tagsRouter);

// New routers: mount under /admin since their paths are relative
router.use("/admin", usersRouter);
router.use("/admin", fabricsRouter);
router.use("/admin", stainsRouter);
router.use("/admin", paymentsRouter);
router.use("/admin", zoomRouter);
router.use("/admin", newsletterRouter);
router.use("/admin", mediaRouter);
router.use("/admin", seoRouter);
router.use("/admin", redirectsRouter);
router.use("/admin", settingsRouter);
router.use("/admin", securityLogsRouter);
router.use("/admin", auditLogsRouter);
router.use("/admin", expertsRouter);
router.use("/admin", appointmentsRouter);
router.use("/admin", pageContentRouter);

export default router;
