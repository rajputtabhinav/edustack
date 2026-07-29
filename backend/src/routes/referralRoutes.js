import { Router } from "express";
import { getReferralsForMe } from "../controllers/userController.js";
import { requireUserAuth } from "../middleware/requireUserAuth.js";

const router = Router();

router.get("/me", requireUserAuth, getReferralsForMe);

export default router;
