import mongoose from "mongoose";
import { BroadcastJob } from "../models/BroadcastJob.js";
import { LeaderboardRewardSettlement } from "../models/LeaderboardRewardSettlement.js";
import { Notification } from "../models/Notification.js";
import { SuspiciousLog } from "../models/SuspiciousLog.js";
import { PaymentRequest } from "../models/PaymentRequest.js";
import { Transaction } from "../models/Transaction.js";
import { User } from "../models/User.js";
import { WithdrawalRequest } from "../models/WithdrawalRequest.js";
import { createNotifications } from "./notificationService.js";
import { generateLeaderboard } from "./leaderboardService.js";

const WEEKLY_LEADERBOARD_REWARDS = {
  1: 50,
  2: 30,
  3: 20
};

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getWeeklyPeriodKey(date = new Date()) {
  const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utcDate.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const weekStart = new Date(utcDate);
  weekStart.setUTCDate(utcDate.getUTCDate() + mondayOffset);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6);

  return `weekly:${weekStart.toISOString().slice(0, 10)}:${weekEnd.toISOString().slice(0, 10)}`;
}

export async function broadcastToAllUsers({ message, createdBy = "admin" }) {
  const users = await User.find({}).select("_id").lean();
  return BroadcastJob.create({
    message,
    createdBy,
    status: "pending"
  });

}

export async function attachBroadcastNotifications(jobId) {
  const users = await User.find({}).select("_id").lean();
  const notifications = users.map((user) => ({
    user: user._id,
    type: "broadcast",
    title: "EduStack update",
    message: "",
    metadata: {
      broadcastJobId: jobId
    }
  }));

  const job = await BroadcastJob.findById(jobId);
  if (!job) {
    return null;
  }

  const payloads = notifications.map((item) => ({
    ...item,
    message: job.message
  }));

  await createNotifications(payloads);
  return job;
}

export async function completeBroadcastJob(jobId, { sent = 0, failed = 0 }) {
  const status = failed > 0 && sent === 0 ? "failed" : "completed";
  return BroadcastJob.findByIdAndUpdate(
    jobId,
    {
      $set: {
        sentCount: sent,
        failedCount: failed,
        status,
        completedAt: new Date()
      }
    },
    { new: true }
  );
}

export async function getFraudReviewSummary() {
  const recentLogs = await SuspiciousLog.find({}).sort({ createdAt: -1 }).limit(20).lean();
  const overlapSummary = await SuspiciousLog.aggregate([
    { $match: { $or: [{ ipAddress: { $ne: "" } }, { deviceFingerprint: { $ne: "" } }] } },
    {
      $group: {
        _id: "$reason",
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  return {
    recentLogs,
    overlapSummary
  };
}

export async function exportDailySummaryCsv() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const [payments, withdrawals, referralRewards] = await Promise.all([
    PaymentRequest.countDocuments({ createdAt: { $gte: start } }),
    WithdrawalRequest.countDocuments({ createdAt: { $gte: start } }),
    Transaction.countDocuments({ type: "referral_reward", createdAt: { $gte: start } })
  ]);

  return [
    "metric,value",
    `payments_today,${payments}`,
    `withdrawals_today,${withdrawals}`,
    `referral_rewards_today,${referralRewards}`
  ].join("\n");
}

export async function settleWeeklyLeaderboardRewards() {
  const periodKey = getWeeklyPeriodKey();
  const existing = await LeaderboardRewardSettlement.findOne({ periodKey });
  if (existing) {
    return existing;
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const entries = await generateLeaderboard("weekly");
    const winners = entries.slice(0, 3).filter((entry) => WEEKLY_LEADERBOARD_REWARDS[entry.rank]);
    const rewards = [];

    for (const winner of winners) {
      const amount = WEEKLY_LEADERBOARD_REWARDS[winner.rank];
      await User.updateOne({ _id: winner.user }, { $inc: { balance: amount } }).session(session);
      await Transaction.create(
        [
          {
            user: winner.user,
            type: "leaderboard_bonus",
            amount,
            direction: "credit",
            description: `Weekly leaderboard reward for rank #${winner.rank}`,
            metadata: {
              rank: winner.rank,
              periodKey
            }
          }
        ],
        { session }
      );
      await createNotifications(
        [
          {
            user: winner.user,
            type: "leaderboard_reward",
            title: "Weekly leaderboard reward",
            message: `You finished rank #${winner.rank} and earned Rs.${amount}.`,
            metadata: { rank: winner.rank, amount, periodKey }
          }
        ],
        session
      );

      rewards.push({
        user: winner.user,
        telegramId: winner.telegramId,
        rank: winner.rank,
        amount
      });
    }

    const [settlement] = await LeaderboardRewardSettlement.create(
      [
        {
          period: "weekly",
          periodKey,
          rewards
        }
      ],
      { session }
    );

    await session.commitTransaction();
    return settlement;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

export async function createReminderNotifications() {
  const dayKey = getTodayKey();
  const [pendingPayments, pendingWithdrawals] = await Promise.all([
    PaymentRequest.find({ status: "pending" }).populate("user", "_id").lean(),
    WithdrawalRequest.find({ status: "pending" }).populate("user", "_id").lean()
  ]);

  const reminders = [];
  const existingReminderSignatures = new Set(
    (
      await Notification.find({
        type: { $in: ["payment_reminder", "withdrawal_reminder", "challenge_reminder"] },
        createdAt: { $gte: new Date(Date.now() - 20 * 60 * 60 * 1000) }
      })
        .select("type metadata")
        .lean()
    ).map((entry) => `${entry.type}:${entry.metadata?.signature || ""}`)
  );

  for (const payment of pendingPayments) {
    const signature = `payment:${payment._id}:${dayKey}`;
    if (!existingReminderSignatures.has(`payment_reminder:${signature}`)) {
      reminders.push({
        user: payment.user._id,
        type: "payment_reminder",
        title: "Payment review pending",
        message: "Your payment proof is still under review.",
        metadata: { signature, paymentRequestId: payment._id }
      });
    }
  }

  for (const withdrawal of pendingWithdrawals) {
    const signature = `withdrawal:${withdrawal._id}:${dayKey}`;
    if (!existingReminderSignatures.has(`withdrawal_reminder:${signature}`)) {
      reminders.push({
        user: withdrawal.user._id,
        type: "withdrawal_reminder",
        title: "Withdrawal still pending",
        message: "Your withdrawal request is still being processed.",
        metadata: { signature, withdrawalRequestId: withdrawal._id }
      });
    }
  }

  const challengeUsers = await User.find({ hasPurchased: true, referralsCount: { $lt: 5 } }).select("_id referralsCount").lean();
  for (const user of challengeUsers) {
    const signature = `challenge:${user._id}:${dayKey}`;
    if (!existingReminderSignatures.has(`challenge_reminder:${signature}`)) {
      reminders.push({
        user: user._id,
        type: "challenge_reminder",
        title: "Weekly challenge is live",
        message: `You are ${5 - (user.referralsCount || 0)} paid referrals away from the weekly challenge reward.`,
        metadata: { signature }
      });
    }
  }

  await createNotifications(reminders);
  return reminders;
}
