import { Router } from "express";
import { createWithdrawal, listPendingWithdrawals, processWithdrawal } from "../controllers/withdrawalController.js";
import { requireAdmin } from "../middleware/adminAuth.js";
import { requireUserAuth } from "../middleware/requireUserAuth.js";
import { validateBody } from "../middleware/validate.js";

const router = Router();

router.post("/request", requireUserAuth, validateBody(["amount", "upiId"]), createWithdrawal);
router.post("/", requireUserAuth, validateBody(["amount", "upiId"]), createWithdrawal);
router.post("/process", requireAdmin, validateBody(["withdrawalRequestId", "approved"]), processWithdrawal);
router.get("/pending", requireAdmin, listPendingWithdrawals);

export default router;
