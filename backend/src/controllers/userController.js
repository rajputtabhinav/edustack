import { env } from "../config/env.js";
import { MIN_WITHDRAWAL, NOTE_PRICE, REFERRAL_JOIN_BONUS, REFERRAL_REWARD } from "../constants/business.js";
import { PaymentRequest } from "../models/PaymentRequest.js";
import { Purchase } from "../models/Purchase.js";
import { User } from "../models/User.js";
import { WithdrawalRequest } from "../models/WithdrawalRequest.js";
import { getCurrentReferralReward } from "../services/bonusService.js";
import { getGrowthSnapshot, getShareTemplates, applyDailyStreakForUser } from "../services/growthService.js";
import { getLeaderboard } from "../services/leaderboardService.js";
import { getUserNotifications } from "../services/notificationService.js";
import { getActivePaymentRoute } from "../services/paymentRouteService.js";
import { getActiveProducts, serializePurchasedProduct } from "../services/productService.js";
import { getUserTransactions } from "../services/transactionService.js";
import { getUserProfile } from "../services/userService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function buildPayoutEstimate(pendingWithdrawal) {
  if (!pendingWithdrawal) {
    return {
      label: "Usually within 24 hours after approval",
      expectedBy: null
    };
  }

  const expectedBy = new Date(new Date(pendingWithdrawal.createdAt).getTime() + 24 * 60 * 60 * 1000);
  return {
    label: "Expected within 24 hours after approval",
    expectedBy
  };
}

export async function getDashboardForTelegramId(telegramId) {
  await applyDailyStreakForUser(telegramId);

  const [user, bonus, leaderboard, products, activePaymentRoute] = await Promise.all([
    getUserProfile(telegramId),
    getCurrentReferralReward(),
    getLeaderboard("all-time"),
    getActiveProducts(),
    getActivePaymentRoute(NOTE_PRICE)
  ]);
  const transactions = await getUserTransactions(user.id);
  const pendingPayment = await PaymentRequest.findOne({
    user: user.id,
    status: "pending"
  })
    .populate("product", "name category price")
    .sort({ createdAt: -1 });
  const pendingWithdrawal = await WithdrawalRequest.findOne({
    user: user.id,
    status: "pending"
  }).sort({ createdAt: -1 });
  const pendingWithdrawals = await WithdrawalRequest.find({
    user: user.id,
    status: "pending"
  })
    .sort({ createdAt: -1 })
    .lean();
  const purchases = await Purchase.find({ user: user.id }).populate("product").sort({ createdAt: -1 }).lean();
  const paymentHistory = await PaymentRequest.find({ user: user.id }).populate("product", "name category price").sort({ createdAt: -1 }).limit(10).lean();
  const withdrawalHistory = await WithdrawalRequest.find({ user: user.id }).sort({ createdAt: -1 }).limit(10).lean();
  const notifications = await getUserNotifications(user.id, 20);
  const growth = await getGrowthSnapshot(user.id);
  const shareTemplates = getShareTemplates(user.referralLink);

  return {
    user,
    config: {
      notePrice: NOTE_PRICE,
      referralReward: REFERRAL_REWARD,
      referralJoinBonus: REFERRAL_JOIN_BONUS,
      minWithdrawal: MIN_WITHDRAWAL,
      paymentRoutes: activePaymentRoute ? [activePaymentRoute] : [],
      activePaymentRoute,
      paymentRouteRotationSize: env.paymentRouteRotationSize,
      payoutEtaHours: 24,
      companyName: env.companyName,
      bonus,
      urgencyLabel: env.limitedTimeBonusLabel,
      shareTemplates
    },
    pendingPayment,
    pendingWithdrawal,
    pendingWithdrawals,
    paymentHistory,
    withdrawalHistory,
    transactions,
    leaderboard,
    products,
    purchases: purchases.map((purchase) => ({
      ...purchase,
      product: serializePurchasedProduct(purchase.product)
    })),
    notifications,
    growth,
    payoutEstimate: buildPayoutEstimate(pendingWithdrawal)
  };
}

export const getMe = asyncHandler(async (req, res) => {
  const payload = await getDashboardForTelegramId(req.telegramUserId);
  res.json(payload);
});

export const getReferralsForMe = asyncHandler(async (req, res) => {
  const user = await User.findOne({ telegramId: String(req.telegramUserId) });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const referrals = await User.find({ referredBy: user._id })
    .sort({ createdAt: -1 })
    .select("telegramId username firstName hasPurchased createdAt rewardGrantedForReferral joinedReferralBonusGranted")
    .lean();

  const analytics = {
    totalInvited: referrals.length,
    joined: referrals.length,
    joinBonusCredited: referrals.filter((entry) => entry.joinedReferralBonusGranted).length,
    purchased: referrals.filter((entry) => entry.hasPurchased).length,
    rewardCredited: referrals.filter((entry) => entry.rewardGrantedForReferral).length
  };
  analytics.conversionRate = analytics.joined > 0 ? Math.round((analytics.purchased / analytics.joined) * 100) : 0;

  res.json({
    referralCount: referrals.length,
    rewardedReferrals: analytics.rewardCredited,
    analytics,
    referrals: referrals.map((entry) => ({
      ...entry,
      timelineStatus: entry.rewardGrantedForReferral
        ? "reward_credited"
        : entry.hasPurchased
          ? "purchased"
          : entry.joinedReferralBonusGranted
            ? "join_bonus_credited"
            : "joined"
    }))
  });
});
