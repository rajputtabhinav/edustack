import { Router } from "express";
import { listPaymentOptions, listPendingPayments, requestPaymentVerification, servePaymentQr, verifyPayment } from "../controllers/paymentController.js";
import { requireAdmin } from "../middleware/adminAuth.js";
import { requireUserAuth } from "../middleware/requireUserAuth.js";
import { uploadScreenshot } from "../middleware/upload.js";
import { validateBody } from "../middleware/validate.js";

const router = Router();

router.get("/options", requireUserAuth, listPaymentOptions);
router.get("/qr/:routeKey", servePaymentQr);
router.post("/request", requireUserAuth, uploadScreenshot.single("screenshot"), requestPaymentVerification);
router.post("/verify", requireAdmin, validateBody(["paymentRequestId", "approved"]), verifyPayment);
router.get("/pending", requireAdmin, listPendingPayments);

export default router;
