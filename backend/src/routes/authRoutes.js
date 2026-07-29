import { Router } from "express";
import { createSession } from "../controllers/authController.js";
import { validateBody } from "../middleware/validate.js";

const router = Router();

router.post("/session", validateBody(["initData"]), createSession);

export default router;
