import { Router, type IRouter } from "express";
import healthRouter from "./health";
import musicRouter from "./music";
import favoritesRouter from "./favorites";
import playlistsRouter from "./playlists";

const router: IRouter = Router();

router.use(healthRouter);
router.use(musicRouter);
router.use(favoritesRouter);
router.use(playlistsRouter);

export default router;
