import { Router } from "express";
import articlesRouter from "./articles";
import authorsRouter from "./authors";
import categoriesRouter from "./categories";
import tagsRouter from "./tags";

const router = Router();

router.use(articlesRouter);
router.use(authorsRouter);
router.use(categoriesRouter);
router.use(tagsRouter);

export default router;
