import { Router } from "express";
import { getMe } from "../controllers/userController.js";
import { requireUserAuth } from "../middleware/requireUserAuth.js";

const router = Router();

router.get("/me", requireUserAuth, getMe);

export default router;
