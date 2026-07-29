import { env } from "../config/env.js";
import { MIN_WITHDRAWAL } from "../constants/business.js";

export function serializeUser(user, extra = {}) {
  const withdrawalRemaining = Math.max(MIN_WITHDRAWAL - user.balance, 0);

  return {
    id: user._id,
    telegramId: user.telegramId,
    username: user.username,
    firstName: user.firstName,
    hasPurchased: user.hasPurchased,
    balance: user.balance,
    availableBalance: user.balance,
    lockedBalance: user.lockedBalance || 0,
    referredBy: user.referredBy?._id || user.referredBy || null,
    referralsCount: user.referralsCount,
    joinedReferralBonusGranted: Boolean(user.joinedReferralBonusGranted),
    xp: user.xp || 0,
    badge: user.badge || "Beginner",
    level: user.level || 1,
    verifiedBadge: Boolean(user.verifiedBadge),
    currentStreak: user.currentStreak || 0,
    longestStreak: user.longestStreak || 0,
    lastActiveDate: user.lastActiveDate || null,
    totalReferralEarnings: user.totalReferralEarnings || 0,
    createdAt: user.createdAt,
    statusBadge: user.hasPurchased ? "Active User" : "Not Purchased",
    referralLink: `https://t.me/${env.botUsername}?start=${user.telegramId}`,
    withdrawalRemaining,
    ...extra
  };
}
