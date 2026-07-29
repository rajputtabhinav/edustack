import { Challenge } from "../models/Challenge.js";
import { Transaction } from "../models/Transaction.js";
import { User } from "../models/User.js";
import { createNotification } from "./notificationService.js";
import { getBadgeFromXp, getLevelFromXp } from "./gamificationService.js";

const APP_TIMEZONE = "Asia/Kolkata";
const REFERRAL_MILESTONES = [
  { key: "3", target: 3, rewardAmount: 10, title: "Milestone unlocked" },
  { key: "5", target: 5, rewardAmount: 20, title: "Momentum bonus unlocked" },
  { key: "10", target: 10, rewardAmount: 50, title: "Pro referrer bonus unlocked" }
];
const DAILY_STREAK_XP = 2;

function getLocalDayString(date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function dayDiff(previousDate, currentDate) {
  const prev = new Date(previousDate);
  const current = new Date(currentDate);
  prev.setHours(0, 0, 0, 0);
  current.setHours(0, 0, 0, 0);
  return Math.round((current - prev) / 86400000);
}

function getChallengePeriodStart(date = new Date()) {
  const utc = new Date(date);
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() - day + 1);
  utc.setUTCHours(0, 0, 0, 0);
  return utc;
}

function getChallengePeriodKey(date = new Date()) {
  return getLocalDayString(getChallengePeriodStart(date));
}

export async function ensureGrowthChallenge() {
  const key = "weekly-paid-referrals-5";
  let challenge = await Challenge.findOne({ key });

  if (!challenge) {
    challenge = await Challenge.create({
      key,
      title: "Invite 5 paid users this week",
      description: "Complete 5 successful paid referrals this week and unlock Rs.20 extra.",
      targetCount: 5,
      rewardAmount: 20,
      period: "weekly",
      isActive: true
    });
  }

  return challenge;
}

async function createRewardTransaction(session, payload) {
  const [transaction] = await Transaction.create([payload], { session });
  return transaction;
}

export async function applyDailyStreakForUser(telegramId) {
  const user = await User.findOne({ telegramId: String(telegramId) });

  if (!user) {
    return null;
  }

  const today = new Date();
  const todayKey = getLocalDayString(today);
  const lastKey = user.lastActiveDate ? getLocalDayString(user.lastActiveDate) : "";

  if (lastKey === todayKey) {
    return user;
  }

  const diff = user.lastActiveDate ? dayDiff(user.lastActiveDate, today) : 1;
  user.currentStreak = diff === 1 ? (user.currentStreak || 0) + 1 : 1;
  user.longestStreak = Math.max(user.longestStreak || 0, user.currentStreak);
  user.lastActiveDate = today;
  user.totalStreakXp = (user.totalStreakXp || 0) + DAILY_STREAK_XP;
  user.xp = (user.xp || 0) + DAILY_STREAK_XP;
  user.badge = getBadgeFromXp(user.xp);
  user.level = getLevelFromXp(user.xp);
  await user.save();

  await createNotification({
    user: user._id,
    type: "streak",
    title: "Daily streak updated",
    message: `You are on a ${user.currentStreak}-day streak and earned ${DAILY_STREAK_XP} XP.`,
    metadata: {
      currentStreak: user.currentStreak,
      xpEarned: DAILY_STREAK_XP
    }
  });

  return user;
}

export async function evaluateReferralMilestonesAndChallenges(referrer, session) {
  const progressMap = referrer.milestoneProgress || new Map();
  const completedMap = referrer.milestoneCompletedAt || new Map();

  for (const milestone of REFERRAL_MILESTONES) {
    progressMap.set(milestone.key, referrer.referralsCount || 0);

    if (!completedMap.get(milestone.key) && (referrer.referralsCount || 0) >= milestone.target) {
      referrer.balance += milestone.rewardAmount;
      completedMap.set(milestone.key, new Date());

      await createRewardTransaction(session, {
        user: referrer._id,
        type: "milestone_bonus",
        amount: milestone.rewardAmount,
        direction: "credit",
        description: `Referral milestone ${milestone.target} completed`,
        metadata: {
          milestoneKey: milestone.key,
          referralCount: referrer.referralsCount
        }
      });

      await createNotification(
        {
          user: referrer._id,
          type: "milestone",
          title: milestone.title,
          message: `You completed ${milestone.target} paid referrals and earned Rs.${milestone.rewardAmount}.`,
          metadata: {
            milestoneKey: milestone.key,
            rewardAmount: milestone.rewardAmount
          }
        },
        session
      );
    }
  }

  referrer.milestoneProgress = progressMap;
  referrer.milestoneCompletedAt = completedMap;

  const challenge = await ensureGrowthChallenge();
  const periodStart = getChallengePeriodStart();
  const periodKey = getChallengePeriodKey();
  const challengeClaimKey = `${challenge.key}:${periodKey}`;

  const completedThisWeek = await Transaction.countDocuments({
    user: referrer._id,
    type: "referral_reward",
    direction: "credit",
    createdAt: { $gte: periodStart }
  }).session(session);

  if (challenge.isActive && completedThisWeek >= challenge.targetCount && !referrer.challengeRewardsClaimed.includes(challengeClaimKey)) {
    referrer.balance += challenge.rewardAmount;
    referrer.challengeRewardsClaimed.push(challengeClaimKey);

    await createRewardTransaction(session, {
      user: referrer._id,
      type: "challenge_bonus",
      amount: challenge.rewardAmount,
      direction: "credit",
      description: challenge.title,
      metadata: {
        challengeKey: challenge.key,
        periodKey
      }
    });

    await createNotification(
      {
        user: referrer._id,
        type: "challenge",
        title: "Weekly challenge completed",
        message: `${challenge.title} and earned Rs.${challenge.rewardAmount}.`,
        metadata: {
          challengeKey: challenge.key,
          rewardAmount: challenge.rewardAmount,
          periodKey
        }
      },
      session
    );
  }
}

export async function getGrowthSnapshot(userId) {
  const [challenge, user] = await Promise.all([
    ensureGrowthChallenge(),
    User.findById(userId).lean()
  ]);

  if (!user) {
    return null;
  }

  const periodStart = getChallengePeriodStart();
  const completedThisWeek = await Transaction.countDocuments({
    user: user._id,
    type: "referral_reward",
    direction: "credit",
    createdAt: { $gte: periodStart }
  });

  const milestones = REFERRAL_MILESTONES.map((milestone) => ({
    key: milestone.key,
    target: milestone.target,
    rewardAmount: milestone.rewardAmount,
    progress: user.referralsCount || 0,
    completedAt: user.milestoneCompletedAt?.get?.(milestone.key) || user.milestoneCompletedAt?.[milestone.key] || null,
    isCompleted: Boolean(user.milestoneCompletedAt?.get?.(milestone.key) || user.milestoneCompletedAt?.[milestone.key])
  }));

  return {
    streak: {
      current: user.currentStreak || 0,
      longest: user.longestStreak || 0,
      totalXpEarned: user.totalStreakXp || 0,
      lastActiveDate: user.lastActiveDate
    },
    milestones,
    challenge: {
      key: challenge.key,
      title: challenge.title,
      description: challenge.description,
      targetCount: challenge.targetCount,
      rewardAmount: challenge.rewardAmount,
      progress: completedThisWeek,
      isCompleted: completedThisWeek >= challenge.targetCount,
      periodKey: getChallengePeriodKey()
    }
  };
}

export function getShareTemplates(referralLink) {
  return {
    whatsapp: `Join EduStack with my link. You get Rs.10 on join, and I earn when you buy notes for Rs.99: ${referralLink}`,
    telegram: `Join EduStack with my referral link. You get Rs.10 on signup, and I earn after your first notes purchase: ${referralLink}`
  };
}
