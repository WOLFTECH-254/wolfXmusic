import { Router, type IRouter } from "express";
import healthRouter from "./health";
import musicRouter from "./music";
import favoritesRouter from "./favorites";
import playlistsRouter from "./playlists";
import authRouter from "./auth";
import playsRouter from "./plays";
import adminRouter from "./admin";
import { authMiddleware } from "../middleware/auth.js";

const router: IRouter = Router();

router.use(authMiddleware);

router.use(healthRouter);
router.use(musicRouter);
router.use(favoritesRouter);
router.use(playlistsRouter);
router.use(authRouter);
router.use(playsRouter);
router.use(adminRouter);

export default router;
