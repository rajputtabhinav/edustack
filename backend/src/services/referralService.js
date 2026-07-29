import mongoose from "mongoose";
import { REFERRAL_JOIN_BONUS } from "../constants/business.js";
import { Transaction } from "../models/Transaction.js";
import { User } from "../models/User.js";
import { getCurrentReferralReward } from "./bonusService.js";
import { getBadgeFromXp, getLevelFromXp } from "./gamificationService.js";
import { createSuspiciousLog } from "./fraudService.js";
import { evaluateReferralMilestonesAndChallenges } from "./growthService.js";
import { createNotification } from "./notificationService.js";

export async function rewardReferralJoinBonusIfEligible(referredUserId, context = {}) {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const referredUser = await User.findById(referredUserId).session(session);

    if (!referredUser?.referredBy || referredUser.joinedReferralBonusGranted) {
      await session.commitTransaction();
      return { rewarded: false, reason: "No eligible referral join bonus" };
    }

    const referrer = await User.findById(referredUser.referredBy).session(session);

    if (!referrer) {
      await session.commitTransaction();
      return { rewarded: false, reason: "Referrer not found" };
    }

    if (
      referredUser.deviceFingerprint &&
      referrer.deviceFingerprint &&
      referredUser.deviceFingerprint === referrer.deviceFingerprint
    ) {
      await createSuspiciousLog(
        {
          user: referredUser._id,
          telegramId: referredUser.telegramId,
          reason: "same_device_referral_join_bonus_blocked",
          ipAddress: context.ipAddress || "",
          deviceFingerprint: context.deviceFingerprint || "",
          metadata: {
            referrerTelegramId: referrer.telegramId
          }
        },
        session
      );
      await session.commitTransaction();
      return { rewarded: false, reason: "Referral join bonus blocked: same device as referrer" };
    }

    if (String(referrer._id) === String(referredUser._id)) {
      await createSuspiciousLog(
        {
          user: referredUser._id,
          telegramId: referredUser.telegramId,
          reason: "self_referral_join_bonus_attempt",
          ipAddress: context.ipAddress || "",
          deviceFingerprint: context.deviceFingerprint || "",
          metadata: {
            referrerTelegramId: referrer.telegramId
          }
        },
        session
      );
      await session.commitTransaction();
      return { rewarded: false, reason: "Self referral join bonus blocked" };
    }

    const existingReward = await Transaction.findOne({
      user: referrer._id,
      type: "referral_join_bonus",
      "metadata.referredUserId": new mongoose.Types.ObjectId(referredUser._id)
    }).session(session);

    if (existingReward) {
      await createSuspiciousLog(
        {
          user: referrer._id,
          telegramId: referrer.telegramId,
          reason: "duplicate_join_bonus_attempt",
          ipAddress: context.ipAddress || "",
          deviceFingerprint: context.deviceFingerprint || "",
          metadata: {
            referredTelegramId: referredUser.telegramId
          }
        },
        session
      );
      await session.commitTransaction();
      return { rewarded: false, reason: "Duplicate join bonus prevented" };
    }

    referrer.balance += REFERRAL_JOIN_BONUS;
    referrer.totalReferralEarnings += REFERRAL_JOIN_BONUS;
    referredUser.balance += REFERRAL_JOIN_BONUS;
    referredUser.joinedReferralBonusGranted = true;

    await referrer.save({ session });
    await referredUser.save({ session });

    await Transaction.create(
      [
        {
          user: referrer._id,
          type: "referral_join_bonus",
          amount: REFERRAL_JOIN_BONUS,
          direction: "credit",
          description: `Referral join bonus from ${referredUser.firstName || referredUser.username || referredUser.telegramId}`,
          metadata: {
            referredUserId: referredUser._id,
            referredTelegramId: referredUser.telegramId,
            referrerTelegramId: referrer.telegramId
          }
        },
        {
          user: referredUser._id,
          type: "referral_signup_bonus",
          amount: REFERRAL_JOIN_BONUS,
          direction: "credit",
          description: `Referral welcome bonus from ${referrer.firstName || referrer.username || referrer.telegramId}`,
          metadata: {
            referredUserId: referredUser._id,
            referredTelegramId: referredUser.telegramId,
            referrerTelegramId: referrer.telegramId
          }
        }
      ],
      { session, ordered: true }
    );

    await Promise.all([
      createNotification(
        {
          user: referrer._id,
          type: "referral_join_bonus",
          title: "Referral join bonus credited",
          message: `You earned Rs.${REFERRAL_JOIN_BONUS} because ${referredUser.firstName || referredUser.username || referredUser.telegramId} joined with your link.`,
          metadata: {
            referredUserId: referredUser._id,
            rewardAmount: REFERRAL_JOIN_BONUS
          }
        },
        session
      ),
      createNotification(
        {
          user: referredUser._id,
          type: "referral_signup_bonus",
          title: "Welcome bonus credited",
          message: `You received Rs.${REFERRAL_JOIN_BONUS} for joining EduStack with a referral link.`,
          metadata: {
            referrerTelegramId: referrer.telegramId,
            rewardAmount: REFERRAL_JOIN_BONUS
          }
        },
        session
      )
    ]);

    await session.commitTransaction();
    return { rewarded: true, rewardAmount: REFERRAL_JOIN_BONUS, referrerId: referrer.telegramId };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

export async function rewardReferrerIfEligible(referredUser, session, context = {}) {
  if (!referredUser.referredBy || referredUser.rewardGrantedForReferral) {
    return { rewarded: false, reason: "No eligible referrer" };
  }

  const referrer = await User.findById(referredUser.referredBy).session(session);

  if (!referrer) {
    return { rewarded: false, reason: "Referrer not found" };
  }

  if (
    referredUser.deviceFingerprint &&
    referrer.deviceFingerprint &&
    referredUser.deviceFingerprint === referrer.deviceFingerprint
  ) {
    await createSuspiciousLog(
      {
        user: referredUser._id,
        telegramId: referredUser.telegramId,
        reason: "same_device_referral_reward_blocked",
        ipAddress: context.ipAddress || "",
        deviceFingerprint: context.deviceFingerprint || "",
        metadata: {
          referrerTelegramId: referrer.telegramId
        }
      },
      session
    );
    return { rewarded: false, reason: "Referral reward blocked: same device as referrer" };
  }

  if (String(referrer._id) === String(referredUser._id)) {
    await createSuspiciousLog(
      {
        user: referredUser._id,
        telegramId: referredUser.telegramId,
        reason: "self_referral_attempt",
        ipAddress: context.ipAddress || "",
        deviceFingerprint: context.deviceFingerprint || "",
        metadata: {
          referrerTelegramId: referrer.telegramId
        }
      },
      session
    );
    return { rewarded: false, reason: "Self referral blocked" };
  }

  const existingReward = await Transaction.findOne({
    user: referrer._id,
    type: "referral_reward",
    "metadata.referredUserId": new mongoose.Types.ObjectId(referredUser._id)
  }).session(session);

  if (existingReward) {
    await createSuspiciousLog(
      {
        user: referrer._id,
        telegramId: referrer.telegramId,
        reason: "duplicate_reward_attempt",
        ipAddress: context.ipAddress || "",
        deviceFingerprint: context.deviceFingerprint || "",
        metadata: {
          referredTelegramId: referredUser.telegramId
        }
      },
      session
    );
    return { rewarded: false, reason: "Duplicate reward prevented" };
  }

  const rewardConfig = await getCurrentReferralReward();
  const rewardAmount = rewardConfig.currentReward;

  referrer.balance += rewardAmount;
  referrer.referralsCount += 1;
  referrer.totalReferralEarnings += rewardAmount;
  referrer.xp += 10;
  referrer.badge = getBadgeFromXp(referrer.xp);
  referrer.level = getLevelFromXp(referrer.xp);
  referredUser.rewardGrantedForReferral = true;

  await referrer.save({ session });
  await referredUser.save({ session });

  await Transaction.create(
    [
      {
        user: referrer._id,
        type: "referral_reward",
        amount: rewardAmount,
        direction: "credit",
        description: `Referral reward from ${referredUser.firstName || referredUser.username || referredUser.telegramId}`,
        metadata: {
          referredUserId: referredUser._id,
          referredTelegramId: referredUser.telegramId,
          referrerTelegramId: referrer.telegramId,
          referrerDisplayName: referrer.firstName || referrer.username || referrer.telegramId,
          bonusApplied: rewardConfig.isBonusLive
        }
      }
    ],
    { session }
  );

  await evaluateReferralMilestonesAndChallenges(referrer, session);
  await createNotification(
    {
      user: referrer._id,
      type: "referral_reward",
      title: "Referral reward credited",
      message: `You earned Rs.${rewardAmount} because ${referredUser.firstName || referredUser.username || referredUser.telegramId} completed a purchase.`,
      metadata: {
        referredUserId: referredUser._id,
        rewardAmount
      }
    },
    session
  );

  return { rewarded: true, referrerId: referrer.telegramId, rewardAmount };
}
