import { AppError } from "../utils/AppError.js";
import { PaymentRequest } from "../models/PaymentRequest.js";
import { notifyAdminsAboutPayment } from "../services/paymentAdminService.js";
import { createPaymentRequest, verifyPaymentRequest } from "../services/paymentService.js";
import { generatePaymentQrBuffer, getActivePaymentRoute } from "../services/paymentRouteService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const requestPaymentVerification = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Screenshot is required" });
  }

  const payment = await createPaymentRequest({
    telegramId: req.telegramUserId,
    screenshotFileName: req.file.originalname || "payment-proof.png",
    screenshotMimeType: req.file.mimetype || "image/png",
    productId: req.body.productId,
    paymentRouteKey: req.body.paymentRouteKey
  });

  try {
    await notifyAdminsAboutPayment(payment._id, {
      fileBuffer: req.file.buffer,
      fileName: req.file.originalname || "payment-proof.png",
      mimeType: req.file.mimetype || "image/png"
    });
  } catch (error) {
    console.error("Failed to notify admins about payment request", error);
    await PaymentRequest.findByIdAndDelete(payment._id);
    throw new AppError("Payment proof could not be submitted right now. Please try again.", 502);
  }

  res.status(201).json({
    message: "Payment screenshot uploaded for review",
    payment
  });
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const { paymentRequestId, approved, adminNote, reviewedBy } = req.body;

  const payment = await verifyPaymentRequest({
    paymentRequestId,
    approved: Boolean(approved),
    adminNote,
    reviewedBy: reviewedBy || "admin",
    context: req.context
  });

  res.json({
    message: `Payment ${payment.status}`,
    payment
  });
});

export const listPendingPayments = asyncHandler(async (req, res) => {
  const payments = await PaymentRequest.find({ status: "pending" })
    .populate("user", "telegramId username firstName")
    .sort({ createdAt: 1 });

  res.json({ payments });
});

export const listPaymentOptions = asyncHandler(async (_req, res) => {
  const activeRoute = await getActivePaymentRoute();

  res.json({
    routes: activeRoute ? [activeRoute] : [],
    activeRoute
  });
});

export const servePaymentQr = asyncHandler(async (req, res) => {
  const qrBuffer = await generatePaymentQrBuffer(req.params.routeKey);
  if (!qrBuffer) {
    throw new AppError("Payment QR route not found", 404);
  }

  res.setHeader("Content-Type", "image/png");
  res.setHeader("Cache-Control", "private, max-age=300");
  res.setHeader("Access-Control-Allow-Origin", "https://web.telegram.org");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (String(req.query.download || "") === "1") {
    const safeKey = String(req.params.routeKey || "payment-route").replace(/[^a-z0-9_-]/gi, "-");
    const requestedName = String(req.query.filename || "").trim();
    const safeFilename = (requestedName || `edustack-${safeKey}-qr.png`).replace(/[^a-zA-Z0-9._-]/g, "-");
    res.setHeader("Content-Disposition", `attachment; filename=\"${safeFilename}\"`);
  }
  res.send(qrBuffer);
});
