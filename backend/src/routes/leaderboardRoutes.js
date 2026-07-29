import { Router } from "express";
import { listLeaderboard } from "../controllers/leaderboardController.js";

const router = Router();

router.get("/", listLeaderboard);

export default router;
