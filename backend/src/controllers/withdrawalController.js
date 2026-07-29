import { WithdrawalRequest } from "../models/WithdrawalRequest.js";
import { notifyAdminsAboutWithdrawal } from "../services/withdrawalAdminService.js";
import { createWithdrawalRequest, processWithdrawalRequest, rollbackWithdrawalRequestForNotificationFailure } from "../services/withdrawalService.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createWithdrawal = asyncHandler(async (req, res) => {
  const { amount, upiId } = req.body;
  const numericAmount = Number(amount);

  const request = await createWithdrawalRequest({
    telegramId: req.telegramUserId,
    amount: numericAmount,
    upiId
  });

  try {
    await notifyAdminsAboutWithdrawal(request._id);
  } catch (error) {
    console.error("Failed to notify admins about withdrawal request", error);
    await rollbackWithdrawalRequestForNotificationFailure(request._id);
    throw new AppError("Withdrawal request could not be submitted right now. Please try again.", 502);
  }

  res.status(201).json({
    message: "Withdrawal request submitted",
    request
  });
});

export const processWithdrawal = asyncHandler(async (req, res) => {
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

export const listPendingWithdrawals = asyncHandler(async (req, res) => {
  const requests = await WithdrawalRequest.find({ status: "pending" })
    .populate("user", "telegramId username firstName")
    .sort({ createdAt: 1 });

  res.json({ requests });
});
