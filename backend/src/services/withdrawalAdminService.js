import QRCode from "qrcode";
import { env } from "../config/env.js";
import { WithdrawalRequest } from "../models/WithdrawalRequest.js";
import { User } from "../models/User.js";

const ACTION_PREFIX = "withdraw";

function escapeTelegram(value) {
  return String(value ?? "").replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
}

function getUserDisplayName(user) {
  return user.firstName || user.username || user.telegramId;
}

function getStatusLabel(user) {
  return user.hasPurchased ? "Active User" : "Not Purchased";
}

function formatDate(value) {
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

export function buildWithdrawalCallbackData(action, withdrawalRequestId, reasonKey = "") {
  return `${ACTION_PREFIX}:${action}:${withdrawalRequestId}${reasonKey ? `:${reasonKey}` : ""}`;
}

export function parseWithdrawalCallbackData(data) {
  const [prefix, action, withdrawalRequestId, reasonKey = ""] = String(data || "").split(":");
  if (prefix !== ACTION_PREFIX || !action || !withdrawalRequestId) {
    return null;
  }
  if (!["approve", "reject_prompt", "reject_reason"].includes(action)) {
    return null;
  }
  return { action, withdrawalRequestId, reasonKey };
}

export async function getWithdrawalAdminSummary(withdrawalRequestId) {
  const request = await WithdrawalRequest.findById(withdrawalRequestId).lean();

  if (!request) {
    return null;
  }

  const user = await User.findById(request.user).lean();

  if (!user) {
    return null;
  }

  return {
    requestId: String(request._id),
    userId: String(user._id),
    telegramId: user.telegramId,
    username: user.username || "",
    firstName: user.firstName || "",
    displayName: getUserDisplayName(user),
    status: request.status,
    statusBadge: getStatusLabel(user),
    amount: request.amount,
    upiId: request.upiId,
    balance: user.balance || 0,
    lockedBalance: user.lockedBalance || 0,
    referralsCount: user.referralsCount || 0,
    totalReferralEarnings: user.totalReferralEarnings || 0,
    joinedReferralBonusGranted: Boolean(user.joinedReferralBonusGranted),
    badge: user.badge || "Beginner",
    level: user.level || 1,
    verifiedBadge: Boolean(user.verifiedBadge),
    currentStreak: user.currentStreak || 0,
    longestStreak: user.longestStreak || 0,
    hasPurchased: Boolean(user.hasPurchased),
    userCreatedAt: user.createdAt,
    createdAt: request.createdAt,
    processedAt: request.processedAt,
    processedBy: request.processedBy || "",
    adminNote: request.adminNote || ""
  };
}

export function formatWithdrawalAdminCaption(summary) {
  const statusLine =
    summary.status === "paid"
      ? "Approved"
      : summary.status === "rejected"
        ? "Rejected"
        : "Pending approval";

  const lines = [
    "*EduStack Withdrawal Request*",
    "",
    `Status: *${escapeTelegram(statusLine)}*`,
    `Amount: *Rs\\.${escapeTelegram(summary.amount)}*`,
    `Payout UPI: \`${escapeTelegram(summary.upiId)}\``,
    "",
    `User: *${escapeTelegram(summary.displayName)}* \\(ID: \`${escapeTelegram(summary.telegramId)}\`\\)`,
    `Username: ${summary.username ? `@${escapeTelegram(summary.username)}` : "N/A"}`,
    `Account: *${escapeTelegram(summary.statusBadge)}*`,
    `Verified badge: *${escapeTelegram(summary.verifiedBadge ? "Yes" : "No")}*`,
    `Notes purchase: *${escapeTelegram(summary.hasPurchased ? "Completed" : "Not purchased")}*`,
    "",
    `Wallet balance: *Rs\\.${escapeTelegram(summary.balance)}*`,
    `Locked balance: *Rs\\.${escapeTelegram(summary.lockedBalance)}*`,
    `Total referrals: *${escapeTelegram(summary.referralsCount)}*`,
    `Referral earnings: *Rs\\.${escapeTelegram(summary.totalReferralEarnings)}*`,
    `Join bonus received: *${escapeTelegram(summary.joinedReferralBonusGranted ? "Yes" : "No")}*`,
    `Badge: *${escapeTelegram(summary.badge)}*`,
    `Level: *${escapeTelegram(summary.level)}*`,
    `Streak: *${escapeTelegram(summary.currentStreak)}* current \\| *${escapeTelegram(summary.longestStreak)}* best`,
    `Profile created: ${escapeTelegram(formatDate(summary.userCreatedAt))}`,
    `Requested: ${escapeTelegram(formatDate(summary.createdAt))}`
  ];

  if (summary.processedAt) {
    lines.push(`Processed: ${escapeTelegram(formatDate(summary.processedAt))}`);
  }

  if (summary.processedBy) {
    lines.push(`Handled by: *${escapeTelegram(summary.processedBy)}*`);
  }

  if (summary.adminNote) {
    lines.push(`Note: *${escapeTelegram(summary.adminNote)}*`);
  }

  return lines.join("\n");
}

export async function generateWithdrawalQrBuffer(upiId) {
  return QRCode.toBuffer(`upi://pay?pa=${encodeURIComponent(upiId)}`, {
    type: "png",
    margin: 1,
    width: 720,
    errorCorrectionLevel: "M",
    color: {
      dark: "#0F172A",
      light: "#F8FAFC"
    }
  });
}

async function sendTelegramPhoto({ chatId, caption, qrBuffer, withdrawalRequestId }) {
  const form = new FormData();
  form.append("chat_id", chatId);
  form.append("caption", caption);
  form.append("parse_mode", "MarkdownV2");
  form.append(
    "reply_markup",
    JSON.stringify({
      inline_keyboard: [
        [
          { text: "Approve", callback_data: buildWithdrawalCallbackData("approve", withdrawalRequestId) },
          { text: "Reject", callback_data: buildWithdrawalCallbackData("reject_prompt", withdrawalRequestId) }
        ]
      ]
    })
  );
  form.append("photo", new Blob([qrBuffer], { type: "image/png" }), "withdrawal-upi.png");

  const response = await fetch(`https://api.telegram.org/bot${env.telegramBotToken}/sendPhoto`, {
    method: "POST",
    body: form
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Telegram sendPhoto failed: ${errorText}`);
  }
}

export async function notifyAdminsAboutWithdrawal(withdrawalRequestId) {
  if (!env.telegramBotToken) {
    throw new Error("Telegram bot token is not configured for withdrawal admin notifications");
  }

  if (env.adminTelegramIds.length === 0) {
    throw new Error("No admin Telegram IDs are configured for withdrawal admin notifications");
  }

  const summary = await getWithdrawalAdminSummary(withdrawalRequestId);

  if (!summary) {
    return;
  }

  const [qrBuffer, caption] = await Promise.all([
    generateWithdrawalQrBuffer(summary.upiId),
    Promise.resolve(formatWithdrawalAdminCaption(summary))
  ]);

  await Promise.all(
    env.adminTelegramIds.map((chatId) =>
      sendTelegramPhoto({
        chatId,
        caption,
        qrBuffer,
        withdrawalRequestId: summary.requestId
      })
    )
  );
}
