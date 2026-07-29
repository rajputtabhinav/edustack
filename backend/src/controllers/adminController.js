import { PaymentRequest } from "../models/PaymentRequest.js";
import { SuspiciousLog } from "../models/SuspiciousLog.js";
import { User } from "../models/User.js";
import { WithdrawalRequest } from "../models/WithdrawalRequest.js";
import { broadcastToAllUsers, createReminderNotifications, exportDailySummaryCsv, getFraudReviewSummary, settleWeeklyLeaderboardRewards } from "../services/adminOpsService.js";
import { getCurrentReferralReward, setBonusConfig } from "../services/bonusService.js";
import { verifyPaymentRequest } from "../services/paymentService.js";
import { processWithdrawalRequest } from "../services/withdrawalService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const adminVerifyPayment = asyncHandler(async (req, res) => {
  const { paymentRequestId, approved, reviewedBy, adminNote } = req.body;

  const payment = await verifyPaymentRequest({
    paymentRequestId,
    approved: Boolean(approved),
    reviewedBy: reviewedBy || "admin",
    adminNote,
    context: req.context
  });

  res.json({
    message: `Payment ${payment.status}`,
    payment
  });
});

export const adminApproveWithdraw = asyncHandler(async (req, res) => {
  const { withdrawalRequestId, approved, processedBy, adminNote } = req.body;

  const request = await processWithdrawalRequest({
    withdrawalRequestId,
    approved: Boolean(approved),
    processedBy: processedBy || "admin",
    adminNote
  });

  res.json({
    message: `Withdrawal ${request.status}`,
    request
  });
});

export const adminSetBonus = asyncHandler(async (req, res) => {
  const bonus = await setBonusConfig(req.body);
  res.json({
    message: "Bonus configuration updated",
    bonus
  });
});

export const adminStats = asyncHandler(async (req, res) => {
  const [users, purchasedUsers, pendingPayments, pendingWithdrawals, suspiciousCount, bonus] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ hasPurchased: true }),
    PaymentRequest.countDocuments({ status: "pending" }),
    WithdrawalRequest.countDocuments({ status: "pending" }),
    SuspiciousLog.countDocuments(),
    getCurrentReferralReward()
  ]);

  res.json({
    company: "Raptorvoid Private Limited",
    users,
    purchasedUsers,
    pendingPayments,
    pendingWithdrawals,
    suspiciousCount,
    bonus
  });
});

export const adminBroadcast = asyncHandler(async (req, res) => {
  const { message, createdBy } = req.body;
  const job = await broadcastToAllUsers({
    message,
    createdBy: createdBy || "admin"
  });
  res.json({
    message: "Broadcast sent",
    job
  });
});

export const adminExportSummary = asyncHandler(async (req, res) => {
  const csv = await exportDailySummaryCsv();
  res.setHeader("Content-Type", "text/csv");
  res.send(csv);
});

export const adminFraudReview = asyncHandler(async (req, res) => {
  const review = await getFraudReviewSummary();
  res.json(review);
});

export const adminSettleWeeklyLeaderboard = asyncHandler(async (req, res) => {
  const settlement = await settleWeeklyLeaderboardRewards();
  res.json({
    message: "Weekly leaderboard settled",
    settlement
  });
});

export const adminSendReminders = asyncHandler(async (req, res) => {
  const reminders = await createReminderNotifications();
  res.json({
    message: "Reminder notifications queued",
    count: reminders.length
  });
});
