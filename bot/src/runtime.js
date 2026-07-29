import TelegramBot from "node-telegram-bot-api";
import { PaymentRequest } from "../../backend/src/models/PaymentRequest.js";
import { SuspiciousLog } from "../../backend/src/models/SuspiciousLog.js";
import { User } from "../../backend/src/models/User.js";
import {
  attachBroadcastNotifications,
  broadcastToAllUsers,
  completeBroadcastJob,
  createReminderNotifications,
  exportDailySummaryCsv
} from "../../backend/src/services/adminOpsService.js";
import { connectDatabase } from "../../backend/src/config/db.js";
import { AppError } from "../../backend/src/utils/AppError.js";
import {
  formatPaymentAdminCaption,
  getPaymentAdminSummary,
  parsePaymentCallbackData
} from "../../backend/src/services/paymentAdminService.js";
import { createOrGetUser, getUserProfile } from "../../backend/src/services/userService.js";
import { verifyPaymentRequest } from "../../backend/src/services/paymentService.js";
import { botEnv } from "./config.js";

const REJECTION_REASONS = {
  invalid_screenshot: "Invalid screenshot",
  amount_mismatch: "Amount mismatch",
  wrong_upi: "Wrong UPI",
  duplicate_request: "Duplicate request"
};

let pollingRuntimePromise;
let webhookRuntimePromise;

const START_COMMAND_REGEX = /\/start(?:\s+(.+))?/;
const ADMIN_INBOX_REGEX = /\/admin_inbox/;
const USERS_REGEX = /\/users/;
const FRAUD_LOGS_REGEX = /\/fraud_logs/;
const DAILY_REPORT_REGEX = /\/daily_report/;
const BROADCAST_REGEX = /\/broadcast(?:\s+([\s\S]+))?/;
const SEND_REMINDERS_REGEX = /\/send_reminders/;

function isAdminTelegramId(telegramId) {
  return botEnv.adminTelegramIds.includes(String(telegramId));
}

function buildReasonKeyboard(kind, requestId) {
  return {
    inline_keyboard: [
      [
        { text: "Invalid screenshot", callback_data: `${kind}:reject_reason:${requestId}:invalid_screenshot` },
        { text: "Amount mismatch", callback_data: `${kind}:reject_reason:${requestId}:amount_mismatch` }
      ],
      [
        { text: "Wrong UPI", callback_data: `${kind}:reject_reason:${requestId}:wrong_upi` },
        { text: "Duplicate request", callback_data: `${kind}:reject_reason:${requestId}:duplicate_request` }
      ]
    ]
  };
}

async function refreshPaymentAdminMessage(bot, callbackQuery, summary, replyMarkup = { inline_keyboard: [] }) {
  const payload = {
    chat_id: callbackQuery.message.chat.id,
    message_id: callbackQuery.message.message_id,
    parse_mode: "MarkdownV2",
    reply_markup: replyMarkup
  };

  if (callbackQuery.message.caption !== undefined) {
    await bot.editMessageCaption(formatPaymentAdminCaption(summary), payload);
    return;
  }

  await bot.editMessageText(formatPaymentAdminCaption(summary), payload);
}

async function safelyRunBotFollowUp(task, label) {
  try {
    await task();
  } catch (error) {
    console.error(`${label} failed`, error);
  }
}

async function notifyPaymentUser(bot, summary) {
  const text =
    summary.status === "approved"
      ? `Your payment of Rs.${summary.amount} was approved. ${summary.product?.name || "Your AI notes PDF"} is now unlocked and ready to download in EduStack.`
      : `Your payment of Rs.${summary.amount} was rejected. ${summary.adminNote || "Please submit valid proof and try again."}`;

  await bot.sendMessage(summary.user.telegramId, text);
}

async function sendBroadcastMessages(bot, message) {
  const users = await User.find({}).select("telegramId").lean();
  let sent = 0;
  let failed = 0;

  for (const user of users) {
    try {
      await bot.sendMessage(user.telegramId, message);
      sent += 1;
    } catch {
      failed += 1;
    }
  }

  return { sent, failed };
}

export async function runReminderCycle(bot) {
  const reminders = await createReminderNotifications();

  for (const reminder of reminders) {
    const user = await User.findById(reminder.user).select("telegramId").lean();
    if (!user?.telegramId) {
      continue;
    }
    try {
      await bot.sendMessage(user.telegramId, `${reminder.title}\n\n${reminder.message}`);
    } catch (error) {
      console.error("Reminder send failed", error);
    }
  }

  return reminders.length;
}

async function handleStartCommand(bot, msg, match) {
  try {
    const startParam = match?.[1] || "";
    const telegramId = String(msg.from.id);
    const username = msg.from.username || "";
    const firstName = msg.from.first_name || "";

    await createOrGetUser({
      telegramId,
      username,
      firstName,
      context: {
        ipAddress: "",
        deviceFingerprint: `bot-${telegramId}`
      }
    });

    const profile = await getUserProfile(telegramId);
    const webAppUrl = `${botEnv.webAppUrl}?tgUser=${telegramId}`;

    await bot.sendMessage(
      msg.chat.id,
      [
        `Welcome to EduStack, ${firstName || username || "there"}!`,
        "",
        "Unlock your AI Master Notes purchase and access the PDF inside EduStack.",
        "Buy AI Master Notes for Rs.199 to unlock direct PDF download access.",
        `Current badge: ${profile.badge} | Level: ${profile.level}`
      ].join("\n"),
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Open EduStack",
                web_app: {
                  url: webAppUrl
                }
              }
            ]
          ]
        }
      }
    );

    if (!profile.hasPurchased) {
      await bot.sendMessage(
        msg.chat.id,
        "Complete your Rs.199 AI notes purchase to unlock your PDF after approval."
      );
    } else {
      await bot.sendMessage(
        msg.chat.id,
        "Your purchase is active. Open EduStack to download your AI notes PDF anytime."
      );
    }
  } catch (error) {
    console.error("Start handler failed", error);
    await bot.sendMessage(msg.chat.id, "Something went wrong while opening EduStack. Please try again.");
  }
}

async function handleAdminInboxCommand(bot, msg) {
  const telegramId = String(msg.from.id);
  if (!isAdminTelegramId(telegramId)) {
    return;
  }

  const [pendingPayments, suspiciousCount] = await Promise.all([
    PaymentRequest.countDocuments({ status: "pending" }),
    SuspiciousLog.countDocuments()
  ]);

  await bot.sendMessage(
    msg.chat.id,
    [
      "*EduStack Admin Inbox*",
      `Pending payments: *${pendingPayments}*`,
      `Suspicious logs: *${suspiciousCount}*`
    ].join("\n"),
    { parse_mode: "Markdown" }
  );
}

async function handleUsersCommand(bot, msg) {
  const telegramId = String(msg.from.id);
  if (!isAdminTelegramId(telegramId)) {
    return;
  }

  const [totalUsers, purchasedUsers, verifiedUsers, pendingPayments] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ hasPurchased: true }),
    User.countDocuments({ verifiedBadge: true }),
    PaymentRequest.countDocuments({ status: "pending" })
  ]);

  await bot.sendMessage(
    msg.chat.id,
    [
      "*EduStack Users*",
      `Total users: *${totalUsers}*`,
      `Purchased users: *${purchasedUsers}*`,
      `Verified users: *${verifiedUsers}*`,
      `Pending payments: *${pendingPayments}*`
    ].join("\n"),
    { parse_mode: "Markdown" }
  );
}

async function handleFraudLogsCommand(bot, msg) {
  const telegramId = String(msg.from.id);
  if (!isAdminTelegramId(telegramId)) {
    return;
  }

  const logs = await SuspiciousLog.find({}).sort({ createdAt: -1 }).limit(5).lean();
  const lines = logs.length
    ? logs.map((log) => `- ${log.reason} | ${log.telegramId || "n/a"} | ${new Date(log.createdAt).toLocaleString("en-IN")}`)
    : ["No suspicious activity logged yet."];

  await bot.sendMessage(msg.chat.id, `Recent fraud signals:\n${lines.join("\n")}`);
}

async function handleDailyReportCommand(bot, msg) {
  const telegramId = String(msg.from.id);
  if (!isAdminTelegramId(telegramId)) {
    return;
  }

  const csv = await exportDailySummaryCsv();
  await bot.sendDocument(msg.chat.id, Buffer.from(csv, "utf-8"), {}, { filename: "edustack-daily-summary.csv", contentType: "text/csv" });
}

async function handleBroadcastCommand(bot, msg, match) {
  const telegramId = String(msg.from.id);
  if (!isAdminTelegramId(telegramId)) {
    return;
  }

  const message = match?.[1]?.trim();
  if (!message) {
    await bot.sendMessage(msg.chat.id, "Use /broadcast followed by the message you want to send.");
    return;
  }

  const job = await broadcastToAllUsers({
    message,
    createdBy: telegramId
  });
  await attachBroadcastNotifications(job._id);
  const result = await sendBroadcastMessages(bot, message);
  await completeBroadcastJob(job._id, result);

  await bot.sendMessage(
    msg.chat.id,
    `Broadcast completed.\nNotifications queued: ${result.sent + result.failed}\nBot messages sent: ${result.sent}\nBot send failures: ${result.failed}`
  );
}

async function handleSendRemindersCommand(bot, msg) {
  const telegramId = String(msg.from.id);
  if (!isAdminTelegramId(telegramId)) {
    return;
  }

  const count = await runReminderCycle(bot);
  await bot.sendMessage(msg.chat.id, `Reminder cycle completed for ${count} notification(s).`);
}

async function handleCallbackQuery(bot, callbackQuery) {
  const parsedPayment = parsePaymentCallbackData(callbackQuery.data);

  if (!parsedPayment) {
    return;
  }

  const actorTelegramId = String(callbackQuery.from.id);

  if (!isAdminTelegramId(actorTelegramId)) {
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "You are not allowed to manage admin actions.",
      show_alert: true
    });
    return;
  }

  if (parsedPayment) {
    try {
      const existingPayment = await getPaymentAdminSummary(parsedPayment.paymentRequestId);

      if (!existingPayment) {
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: "Payment request was not found.",
          show_alert: true
        });
        return;
      }

      if (parsedPayment.action === "reject_prompt") {
        await refreshPaymentAdminMessage(bot, callbackQuery, existingPayment, buildReasonKeyboard("payment", parsedPayment.paymentRequestId));
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: "Choose a rejection reason."
        });
        return;
      }

      if (existingPayment.status !== "pending") {
        await refreshPaymentAdminMessage(bot, callbackQuery, existingPayment);
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: `Already ${existingPayment.status}.`
        });
        return;
      }

      const adminNote = parsedPayment.action === "reject_reason" ? REJECTION_REASONS[parsedPayment.reasonKey] || "Rejected by admin" : "";
      await verifyPaymentRequest({
        paymentRequestId: parsedPayment.paymentRequestId,
        approved: parsedPayment.action === "approve",
        reviewedBy: actorTelegramId,
        adminNote
      });

      const updatedPayment = await getPaymentAdminSummary(parsedPayment.paymentRequestId);
      if (updatedPayment) {
        await safelyRunBotFollowUp(
          () => refreshPaymentAdminMessage(bot, callbackQuery, updatedPayment),
          "Payment admin message refresh"
        );
        await safelyRunBotFollowUp(
          () => notifyPaymentUser(bot, updatedPayment),
          "Payment user notification"
        );
      }

      await bot.answerCallbackQuery(callbackQuery.id, {
        text: parsedPayment.action === "approve" ? "Payment approved." : "Payment rejected."
      });
      return;
    } catch (error) {
      console.error("Payment callback failed", error);

      if (error instanceof AppError && error.message.toLowerCase().includes("already processed")) {
        const summary = await getPaymentAdminSummary(parsedPayment.paymentRequestId);
        if (summary) {
          await refreshPaymentAdminMessage(bot, callbackQuery, summary);
        }
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: "This payment has already been handled."
        });
        return;
      }

      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "Could not process this payment right now.",
        show_alert: true
      });
      return;
    }
  }
}

function registerHandlers(bot) {
  bot.onText(START_COMMAND_REGEX, (msg, match) => {
    void handleStartCommand(bot, msg, match);
  });

  bot.onText(ADMIN_INBOX_REGEX, (msg) => {
    void handleAdminInboxCommand(bot, msg);
  });

  bot.onText(USERS_REGEX, (msg) => {
    void handleUsersCommand(bot, msg);
  });

  bot.onText(FRAUD_LOGS_REGEX, (msg) => {
    void handleFraudLogsCommand(bot, msg);
  });

  bot.onText(DAILY_REPORT_REGEX, (msg) => {
    void handleDailyReportCommand(bot, msg);
  });

  bot.onText(BROADCAST_REGEX, (msg, match) => {
    void handleBroadcastCommand(bot, msg, match);
  });

  bot.onText(SEND_REMINDERS_REGEX, (msg) => {
    void handleSendRemindersCommand(bot, msg);
  });

  bot.on("polling_error", (error) => {
    console.error("Polling error", error);
  });

  bot.on("callback_query", (callbackQuery) => {
    void handleCallbackQuery(bot, callbackQuery);
  });
}

export async function handleWebhookUpdate(update, runtime) {
  const activeRuntime = runtime || (await getBotRuntime({ polling: false }));
  const bot = activeRuntime.bot;
  const message = update?.message || update?.edited_message;
  const text = message?.text || "";

  if (text) {
    let match = text.match(START_COMMAND_REGEX);
    if (match) {
      await handleStartCommand(bot, message, match);
      return;
    }

    match = text.match(ADMIN_INBOX_REGEX);
    if (match) {
      await handleAdminInboxCommand(bot, message);
      return;
    }

    match = text.match(USERS_REGEX);
    if (match) {
      await handleUsersCommand(bot, message);
      return;
    }

    match = text.match(FRAUD_LOGS_REGEX);
    if (match) {
      await handleFraudLogsCommand(bot, message);
      return;
    }

    match = text.match(DAILY_REPORT_REGEX);
    if (match) {
      await handleDailyReportCommand(bot, message);
      return;
    }

    match = text.match(BROADCAST_REGEX);
    if (match) {
      await handleBroadcastCommand(bot, message, match);
      return;
    }

    match = text.match(SEND_REMINDERS_REGEX);
    if (match) {
      await handleSendRemindersCommand(bot, message);
      return;
    }
  }

  if (update?.callback_query) {
    await handleCallbackQuery(bot, update.callback_query);
    return;
  }

  await bot.processUpdate(update);
}

async function createRuntime({ polling }) {
  if (!botEnv.token) {
    throw new Error("TELEGRAM_BOT_TOKEN is required");
  }

  await connectDatabase();
  const bot = new TelegramBot(botEnv.token, { polling });
  registerHandlers(bot);
  return { bot };
}

export function getBotRuntime({ polling = false } = {}) {
  if (polling) {
    if (!pollingRuntimePromise) {
      pollingRuntimePromise = createRuntime({ polling: true });
    }
    return pollingRuntimePromise;
  }

  if (!webhookRuntimePromise) {
    webhookRuntimePromise = createRuntime({ polling: false });
  }
  return webhookRuntimePromise;
}

export function verifyTelegramWebhookRequest({ headers = {}, querySecret = "" } = {}) {
  if (!botEnv.webhookSecret) {
    return botEnv.nodeEnv !== "production";
  }

  const headerValue =
    headers["x-telegram-bot-api-secret-token"] ||
    headers["X-Telegram-Bot-Api-Secret-Token"] ||
    headers["X-TELEGRAM-BOT-API-SECRET-TOKEN"] ||
    "";

  return String(headerValue).trim() === botEnv.webhookSecret || String(querySecret).trim() === botEnv.webhookSecret;
}

export function verifyCronRequest(headers = {}) {
  if (!botEnv.cronSecret) {
    return botEnv.nodeEnv !== "production";
  }

  const authHeader = String(headers.authorization || headers.Authorization || "");
  return authHeader === `Bearer ${botEnv.cronSecret}`;
}

export function getWebhookUrl(baseUrl) {
  const url = new URL(`${String(baseUrl || botEnv.webhookBaseUrl).replace(/\/$/, "")}/api/webhook`);
  if (botEnv.webhookSecret) {
    url.searchParams.set("secret", botEnv.webhookSecret);
  }
  return url.toString();
}
