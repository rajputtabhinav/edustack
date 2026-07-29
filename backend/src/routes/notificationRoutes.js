import { Router } from "express";
import { listMyNotifications, markMyNotificationRead } from "../controllers/notificationController.js";
import { requireUserAuth } from "../middleware/requireUserAuth.js";

const router = Router();

router.use(requireUserAuth);
router.get("/", listMyNotifications);
router.post("/:id/read", markMyNotificationRead);

export default router;
