import { Router } from "express";
import healthRouter from "./health";
import articlesRouter from "./articles";
import categoriesRouter from "./categories";
import tagsRouter from "./tags";
import searchRouter from "./search";
import newsletterRouter from "./newsletter";
import servicesRouter from "./services";
import expertsRouter from "./experts";
import appointmentsRouter from "./appointments";
import testimonialsRouter from "./testimonials";
import statsRouter from "./stats";
import knowledgeRouter from "./knowledge";
import adminRouter from "./admin";
import userRouter from "./user";
import pageContentRouter from "./page-content";

const router = Router();

router.use(healthRouter);
router.use(adminRouter);          // /admin/* — must come before public routes
router.use(userRouter);           // /user/* — authenticated user endpoints
router.use(articlesRouter);
router.use(categoriesRouter);
router.use(tagsRouter);
router.use(searchRouter);
router.use(newsletterRouter);
router.use(servicesRouter);
router.use(expertsRouter);
router.use(appointmentsRouter);
router.use(testimonialsRouter);
router.use(statsRouter);
router.use(knowledgeRouter);
router.use(pageContentRouter);

export default router;
