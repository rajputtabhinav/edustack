import { Router } from "express";
import { consumeProductDownloadLink, createMyProductDownloadLink, listProducts, sendMyProductToTelegramChat } from "../controllers/productController.js";
import { requireUserAuth } from "../middleware/requireUserAuth.js";

const router = Router();

router.get("/download/:token", consumeProductDownloadLink);
router.get("/", listProducts);
router.post("/:id/download-link", requireUserAuth, createMyProductDownloadLink);
router.post("/:id/send-to-chat", requireUserAuth, sendMyProductToTelegramChat);

export default router;
