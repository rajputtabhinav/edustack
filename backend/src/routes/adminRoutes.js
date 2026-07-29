import { Router } from "express";
import {
  adminApproveWithdraw,
  adminBroadcast,
  adminExportSummary,
  adminFraudReview,
  adminSendReminders,
  adminSetBonus,
  adminSettleWeeklyLeaderboard,
  adminStats,
  adminVerifyPayment
} from "../controllers/adminController.js";
import { requireAdmin } from "../middleware/adminAuth.js";
import { validateBody } from "../middleware/validate.js";

const router = Router();

router.use(requireAdmin);
router.post("/verify-payment", validateBody(["paymentRequestId", "approved"]), adminVerifyPayment);
router.post("/approve-withdraw", validateBody(["withdrawalRequestId", "approved"]), adminApproveWithdraw);
router.post("/set-bonus", adminSetBonus);
router.post("/broadcast", validateBody(["message"]), adminBroadcast);
router.post("/settle-weekly-leaderboard", adminSettleWeeklyLeaderboard);
router.post("/send-reminders", adminSendReminders);
router.get("/fraud-review", adminFraudReview);
router.get("/export-summary", adminExportSummary);
router.get("/stats", adminStats);

export default router;
