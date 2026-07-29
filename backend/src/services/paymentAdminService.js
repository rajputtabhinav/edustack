import { env } from "../config/env.js";
import { PaymentRequest } from "../models/PaymentRequest.js";

const ACTION_PREFIX = "payment";

function escapeTelegram(value) {
  return String(value ?? "").replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
}

export function buildPaymentCallbackData(action, paymentRequestId, reasonKey = "") {
  return `${ACTION_PREFIX}:${action}:${paymentRequestId}${reasonKey ? `:${reasonKey}` : ""}`;
}

export function parsePaymentCallbackData(data) {
  const [prefix, action, paymentRequestId, reasonKey = ""] = String(data || "").split(":");
  if (prefix !== ACTION_PREFIX || !action || !paymentRequestId) {
    return null;
  }
  if (!["approve", "reject_prompt", "reject_reason"].includes(action)) {
    return null;
  }
  return { action, paymentRequestId, reasonKey };
}

export async function getPaymentAdminSummary(paymentRequestId) {
  const payment = await PaymentRequest.findById(paymentRequestId)
    .populate("user", "telegramId username firstName hasPurchased balance lockedBalance referralsCount totalReferralEarnings badge level verifiedBadge")
    .populate("product", "name category price")
    .lean();

  if (!payment || !payment.user) {
    return null;
  }

  return {
    requestId: String(payment._id),
    status: payment.status,
    amount: payment.amount,
    paymentRouteKey: payment.paymentRouteKey || "",
    paymentRouteLabel: payment.paymentRouteLabel || "",
    screenshotFileName: payment.screenshotFileName || "payment-proof.png",
    screenshotMimeType: payment.screenshotMimeType || "image/png",
    telegramPhotoFileId: payment.telegramPhotoFileId || "",
    createdAt: payment.createdAt,
    reviewedAt: payment.reviewedAt,
    adminNote: payment.adminNote || "",
    user: payment.user,
    product: payment.product || null
  };
}

export function formatPaymentAdminCaption(summary) {
  const lines = [
    "*EduStack Payment Review*",
    "",
    `Amount: *Rs\\.${escapeTelegram(summary.amount)}*`,
    `Product: *${escapeTelegram(summary.product?.name || "Notes Pack")}*`,
    `Payment route: *${escapeTelegram(summary.paymentRouteLabel || summary.paymentRouteKey || "Auto route")}*`,
    `Status: *${escapeTelegram(summary.status)}*`,
    "",
    `User: *${escapeTelegram(summary.user.firstName || summary.user.username || summary.user.telegramId)}* \\(ID: \`${escapeTelegram(summary.user.telegramId)}\`\\)`,
    `Username: ${summary.user.username ? `@${escapeTelegram(summary.user.username)}` : "N/A"}`,
    `Account: *${escapeTelegram(summary.user.hasPurchased ? "Active User" : "Not Purchased")}*`,
    `Wallet balance: *Rs\\.${escapeTelegram(summary.user.balance || 0)}*`,
    `Total referrals: *${escapeTelegram(summary.user.referralsCount || 0)}*`,
    `Referral earnings: *Rs\\.${escapeTelegram(summary.user.totalReferralEarnings || 0)}*`,
    `Badge: *${escapeTelegram(summary.user.badge || "Beginner")}*`,
    `Level: *${escapeTelegram(summary.user.level || 1)}*`
  ];

  if (summary.adminNote) {
    lines.push(`Note: *${escapeTelegram(summary.adminNote)}*`);
  }

  return lines.join("\n");
}

async function sendTelegramPayload(chatId, summary, { fileBuffer, fileName, mimeType, photoFileId } = {}) {
  const replyMarkup = JSON.stringify({
    inline_keyboard: [
      [
        { text: "Approve", callback_data: buildPaymentCallbackData("approve", summary.requestId) },
        { text: "Reject", callback_data: buildPaymentCallbackData("reject_prompt", summary.requestId) }
      ]
    ]
  });

  async function parseTelegramJson(response, contextLabel) {
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.ok) {
      throw new Error(`Telegram ${contextLabel} failed: ${JSON.stringify(payload || {})}`);
    }
    return payload.result;
  }

  async function ensureTelegramOk(response, contextLabel) {
    if (response.ok) {
      return;
    }
    const errorText = await response.text();
    throw new Error(`Telegram ${contextLabel} failed: ${errorText}`);
  }

  if (fileBuffer || photoFileId) {
    const form = new FormData();
    form.append("chat_id", chatId);
    form.append("caption", formatPaymentAdminCaption(summary));
    form.append("parse_mode", "MarkdownV2");
    form.append("reply_markup", replyMarkup);
    if (photoFileId) {
      form.append("photo", photoFileId);
    } else {
      form.append("photo", new Blob([fileBuffer], { type: mimeType || summary.screenshotMimeType || "image/png" }), fileName || summary.screenshotFileName || "payment-proof.png");
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${env.telegramBotToken}/sendPhoto`, {
        method: "POST",
        body: form
      });
      const result = await parseTelegramJson(response, "sendPhoto");
      const biggestPhoto = Array.isArray(result?.photo) ? result.photo[result.photo.length - 1] : null;
      return {
        messageId: result?.message_id || null,
        photoFileId: biggestPhoto?.file_id || photoFileId || ""
      };
    } catch (error) {
      console.error("Payment admin sendPhoto failed, falling back to sendDocument/sendMessage", error);
    }
  }

  if (fileBuffer) {
    const form = new FormData();
    form.append("chat_id", chatId);
    form.append("caption", formatPaymentAdminCaption(summary));
    form.append("parse_mode", "MarkdownV2");
    form.append("reply_markup", replyMarkup);
    form.append("document", new Blob([fileBuffer], { type: mimeType || summary.screenshotMimeType || "image/png" }), fileName || summary.screenshotFileName || "payment-proof.png");

    try {
      const response = await fetch(`https://api.telegram.org/bot${env.telegramBotToken}/sendDocument`, {
        method: "POST",
        body: form
      });
      await parseTelegramJson(response, "sendDocument");
      return {
        messageId: null,
        photoFileId: photoFileId || ""
      };
    } catch (error) {
      console.error("Payment admin sendDocument failed, falling back to sendMessage", error);
    }
  }

  const response = await fetch(`https://api.telegram.org/bot${env.telegramBotToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: formatPaymentAdminCaption(summary),
      parse_mode: "MarkdownV2",
      reply_markup: JSON.parse(replyMarkup)
    })
  });
  await ensureTelegramOk(response, "sendMessage");
  return {
    messageId: null,
    photoFileId: photoFileId || ""
  };
}

export async function notifyAdminsAboutPayment(paymentRequestId, upload = {}) {
  if (!env.telegramBotToken) {
    throw new Error("Telegram bot token is not configured for payment admin notifications");
  }

  if (env.adminTelegramIds.length === 0) {
    throw new Error("No admin Telegram IDs are configured for payment admin notifications");
  }

  const summary = await getPaymentAdminSummary(paymentRequestId);
  if (!summary) {
    return;
  }

  let reusablePhotoFileId = summary.telegramPhotoFileId || "";
  for (const chatId of env.adminTelegramIds) {
    const result = await sendTelegramPayload(chatId, summary, {
      fileBuffer: upload.fileBuffer,
      fileName: upload.fileName,
      mimeType: upload.mimeType,
      photoFileId: reusablePhotoFileId
    });
    if (result?.photoFileId && !reusablePhotoFileId) {
      reusablePhotoFileId = result.photoFileId;
    }
  }

  if (reusablePhotoFileId && reusablePhotoFileId !== summary.telegramPhotoFileId) {
    await PaymentRequest.findByIdAndUpdate(paymentRequestId, {
      $set: {
        telegramPhotoFileId: reusablePhotoFileId
      }
    });
  }
}
