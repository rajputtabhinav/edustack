import dotenv from "dotenv";

dotenv.config();

function cleanEnv(value, fallback = "") {
  return String(value ?? fallback)
    .replace(/\\r\\n/g, "")
    .trim();
}

function parseTelegramIds(raw) {
  return cleanEnv(raw)
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

const webAppUrl = cleanEnv(process.env.WEB_APP_URL);

if (!webAppUrl || webAppUrl.includes("your-app.vercel.app") || webAppUrl.includes("your-frontend-domain.com")) {
  console.warn("WEB_APP_URL is not set to a real deployed HTTPS frontend URL yet.");
}

export const botEnv = {
  token: cleanEnv(process.env.TELEGRAM_BOT_TOKEN),
  webAppUrl,
  mongoUri: cleanEnv(process.env.MONGODB_URI, "mongodb://127.0.0.1:27017/edustack"),
  nodeEnv: cleanEnv(process.env.NODE_ENV, "development"),
  adminTelegramIds: parseTelegramIds(process.env.ADMIN_TELEGRAM_IDS),
  webhookSecret: cleanEnv(process.env.TELEGRAM_WEBHOOK_SECRET),
  webhookBaseUrl: cleanEnv(process.env.BOT_WEBHOOK_BASE_URL),
  adminApiKey: cleanEnv(process.env.ADMIN_API_KEY),
  cronSecret: cleanEnv(process.env.CRON_SECRET)
};
