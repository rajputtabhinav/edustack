import mongoose from "mongoose";
import { MIN_WITHDRAWAL } from "../constants/business.js";
import { Transaction } from "../models/Transaction.js";
import { User } from "../models/User.js";
import { WithdrawalRequest } from "../models/WithdrawalRequest.js";
import { AppError } from "../utils/AppError.js";
import { createNotification } from "./notificationService.js";

export async function createWithdrawalRequest({ telegramId, amount, upiId }) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError("Invalid withdrawal amount", 422);
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const user = await User.findOne({ telegramId: String(telegramId) }).session(session);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (!user.hasPurchased) {
      throw new AppError("Purchase required before withdrawals are unlocked");
    }

    if (amount < MIN_WITHDRAWAL) {
      throw new AppError(`Minimum withdrawal amount is ${MIN_WITHDRAWAL}`);
    }

    if (amount > user.balance) {
      throw new AppError("Insufficient balance");
    }

    const pendingRequest = await WithdrawalRequest.findOne({
      user: user._id,
      status: "pending"
    }).session(session);

    if (pendingRequest) {
      throw new AppError("You already have a pending withdrawal request");
    }

    user.balance -= amount;
    user.lockedBalance += amount;
    await user.save({ session });

    const [request] = await WithdrawalRequest.create(
      [
        {
          user: user._id,
          amount,
          upiId
        }
      ],
      { session }
    );

    await session.commitTransaction();
    return request;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

export async function processWithdrawalRequest({ withdrawalRequestId, approved, processedBy, adminNote }) {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const request = await WithdrawalRequest.findById(withdrawalRequestId).session(session);

    if (!request) {
      throw new AppError("Withdrawal request not found", 404);
    }

    if (request.status !== "pending") {
      throw new AppError("Withdrawal request already processed");
    }

    const user = await User.findById(request.user).session(session);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    request.status = approved ? "paid" : "rejected";
    request.processedAt = new Date();
    request.processedBy = processedBy;
    request.adminNote = adminNote || "";

    if (approved) {
      user.lockedBalance = Math.max((user.lockedBalance || 0) - request.amount, 0);
      await user.save({ session });

      await Transaction.create(
        [
          {
            user: user._id,
            type: "withdrawal",
            amount: request.amount,
            direction: "debit",
            description: `Withdrawal paid to ${request.upiId}`,
            metadata: {
              withdrawalRequestId: request._id
            }
          }
        ],
        { session }
      );

      await createNotification(
        {
          user: user._id,
          type: "withdrawal_paid",
          title: "Withdrawal approved",
          message: `Your withdrawal of Rs.${request.amount} has been approved.`,
          metadata: {
            withdrawalRequestId: request._id,
            processedAt: request.processedAt
          }
        },
        session
      );
    } else {
      user.balance += request.amount;
      user.lockedBalance = Math.max((user.lockedBalance || 0) - request.amount, 0);
      await user.save({ session });

      await createNotification(
        {
          user: user._id,
          type: "withdrawal_rejected",
          title: "Withdrawal rejected",
          message: adminNote || `Your withdrawal of Rs.${request.amount} was rejected and returned to your wallet.`,
          metadata: {
            withdrawalRequestId: request._id,
            processedAt: request.processedAt
          }
        },
        session
      );
    }

    await request.save({ session });
    await session.commitTransaction();

    return request;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

export async function rollbackWithdrawalRequestForNotificationFailure(withdrawalRequestId) {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const request = await WithdrawalRequest.findById(withdrawalRequestId).session(session);
    if (!request || request.status !== "pending") {
      await session.commitTransaction();
      return null;
    }

    const user = await User.findById(request.user).session(session);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    user.balance += request.amount;
    user.lockedBalance = Math.max((user.lockedBalance || 0) - request.amount, 0);
    await user.save({ session });

    await WithdrawalRequest.deleteOne({ _id: request._id }).session(session);
    await session.commitTransaction();
    return request;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
