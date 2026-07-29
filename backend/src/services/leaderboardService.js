import { LeaderboardSnapshot } from "../models/LeaderboardSnapshot.js";
import { Transaction } from "../models/Transaction.js";

function getDateWindow(period) {
  const now = new Date();

  if (period === "daily") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { createdAt: { $gte: start } };
  }

  if (period === "weekly") {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const day = start.getUTCDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    start.setUTCDate(start.getUTCDate() + mondayOffset);
    return { createdAt: { $gte: start } };
  }

  return {};
}

export async function generateLeaderboard(period = "all-time") {
  const match = {
    type: "referral_reward",
    direction: "credit",
    ...getDateWindow(period)
  };

  const aggregation = await Transaction.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$user",
        amount: { $sum: "$amount" },
        telegramId: { $last: "$metadata.referrerTelegramId" },
        displayName: { $last: "$metadata.referrerDisplayName" }
      }
    },
    { $sort: { amount: -1, _id: 1 } },
    { $limit: 25 }
  ]);

  const entries = aggregation.map((entry, index) => ({
    user: entry._id,
    telegramId: entry.telegramId || "",
    displayName: entry.displayName || "User",
    amount: entry.amount,
    rank: index + 1
  }));

  await LeaderboardSnapshot.findOneAndUpdate(
    { period },
    {
      period,
      entries,
      generatedAt: new Date()
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return entries;
}

export async function getLeaderboard(period = "all-time") {
  const normalizedPeriod = ["daily", "weekly", "all-time"].includes(period) ? period : "all-time";
  const entries = await generateLeaderboard(normalizedPeriod);

  return {
    period: normalizedPeriod,
    entries
  };
}
