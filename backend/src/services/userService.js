import { env } from "../config/env.js";
import { ChannelAccess } from "../models/ChannelAccess.js";
import { User } from "../models/User.js";
import { Transaction } from "../models/Transaction.js";
import { AppError } from "../utils/AppError.js";
import { serializeUser } from "../utils/serializers.js";
import { updateUserContext, checkSuspiciousReferralSignals } from "./fraudService.js";
import { createNotification } from "./notificationService.js";
import { rewardReferralJoinBonusIfEligible } from "./referralService.js";

export async function findUserByTelegramId(telegramId) {
  return User.findOne({ telegramId: String(telegramId) });
}

export async function createOrGetUser({ telegramId, username = "", firstName = "", referredByTelegramId, context = {} }) {
  const normalizedTelegramId = String(telegramId);

  if (!normalizedTelegramId) {
    throw new AppError("telegramId is required");
  }

  let user = await User.findOne({ telegramId: normalizedTelegramId });

  if (user) {
    if (!user.username && username) {
      user.username = username;
    }
    if (!user.firstName && firstName) {
      user.firstName = firstName;
    }

    let referredBy = null;
    if (!user.referredBy && !user.hasPurchased && referredByTelegramId && String(referredByTelegramId) !== normalizedTelegramId) {
      referredBy = await User.findOne({ telegramId: String(referredByTelegramId) });
      if (referredBy) {
        user.referredBy = referredBy._id;
      }
    }

    await updateUserContext(user, context);

    if (referredBy) {
      await checkSuspiciousReferralSignals({
        referrerId: referredBy._id,
        referredUser: user,
        context
      });

      await createNotification({
        user: user._id,
        type: "referral_onboarding",
        title: "You were invited",
        message: `${referredBy.firstName || referredBy.username || referredBy.telegramId} invited you to EduStack. You will receive Rs.10 on join and can unlock your notes with a Rs.199 purchase.`,
        metadata: {
          referrerTelegramId: referredBy.telegramId,
          referrerName: referredBy.firstName || referredBy.username || referredBy.telegramId
        }
      });

      await rewardReferralJoinBonusIfEligible(user._id, context);
    }

    return user;
  }

  let referredBy = null;

  if (referredByTelegramId && String(referredByTelegramId) !== normalizedTelegramId) {
    referredBy = await User.findOne({ telegramId: String(referredByTelegramId) });
  }

  user = await User.create({
    telegramId: normalizedTelegramId,
    username,
    firstName,
    referredBy: referredBy?._id || null
  });

  await updateUserContext(user, context);
  await checkSuspiciousReferralSignals({
    referrerId: referredBy?._id || null,
    referredUser: user,
    context
  });

  if (referredBy) {
    await createNotification({
      user: user._id,
      type: "referral_onboarding",
      title: "You were invited",
      message: `${referredBy.firstName || referredBy.username || referredBy.telegramId} invited you to EduStack. You will receive Rs.10 on join and can unlock your notes with a Rs.199 purchase.`,
      metadata: {
        referrerTelegramId: referredBy.telegramId,
        referrerName: referredBy.firstName || referredBy.username || referredBy.telegramId
      }
    });

    await rewardReferralJoinBonusIfEligible(user._id, context);
  }

  return user;
}

export async function getUserProfile(telegramId) {
  const user = await User.findOne({ telegramId: String(telegramId) }).populate("referredBy", "telegramId username firstName");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const earnings = await Transaction.aggregate([
    { $match: { user: user._id, direction: "credit" } },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);

  const channelAccess = await ChannelAccess.findOne({ user: user._id }).lean();

  return serializeUser(user, {
    totalEarnings: earnings[0]?.total || 0,
    greetingName: user.firstName || user.username || "Learner",
    pendingWithdrawalsTotal: user.lockedBalance || 0,
    privateChannelAccess: channelAccess
  });
}

export function getBotStartLink(telegramId) {
  return `https://t.me/${env.botUsername}?start=${telegramId}`;
}
