import dotenv from "dotenv";

dotenv.config();

function cleanEnv(value, fallback = "") {
  return String(value ?? fallback).trim();
}

function parseOrigins(raw) {
  return cleanEnv(raw)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseTelegramIds(raw) {
  return cleanEnv(raw)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const nodeEnv = cleanEnv(process.env.NODE_ENV, "development");
const isProd = nodeEnv === "production";

const clientUrl = cleanEnv(process.env.CLIENT_URL, "https://your-frontend-domain.com");
const aiNotesPdfDefaultUrl = clientUrl && !clientUrl.includes("your-frontend-domain.com")
  ? `${clientUrl.replace(/\/$/, "")}/downloads/ai-master-notes-v1.pdf`
  : "";

const corsOrigins = process.env.CORS_ORIGINS
  ? parseOrigins(process.env.CORS_ORIGINS)
  : parseOrigins(`${clientUrl},http://localhost:5173,http://127.0.0.1:5173`);

const jwtSecret =
  cleanEnv(process.env.JWT_SECRET) ||
  (isProd ? "" : "dev-edustack-jwt-secret-min-32-chars-x");

export const env = {
  nodeEnv,
  port: Number(cleanEnv(process.env.PORT, 8080)),
  mongoUri: cleanEnv(process.env.MONGODB_URI, "mongodb://127.0.0.1:27017/edustack"),
  mongoMaxPoolSize: Number(cleanEnv(process.env.MONGO_MAX_POOL_SIZE, 25)),
  mongoServerSelectionTimeoutMs: Number(cleanEnv(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS, 10000)),
  clientUrl,
  corsOrigins,
  botUsername: cleanEnv(process.env.BOT_USERNAME, "EduStackProBot"),
  telegramBotToken: cleanEnv(process.env.TELEGRAM_BOT_TOKEN),
  jwtSecret,
  jwtExpiresSec: cleanEnv(process.env.JWT_EXPIRES_SEC, "7d"),
  adminApiKey: cleanEnv(process.env.ADMIN_API_KEY, !isProd ? "change-me" : ""),
  adminTelegramIds: parseTelegramIds(process.env.ADMIN_TELEGRAM_IDS),
  upiId: cleanEnv(process.env.UPI_ID, "abhinavrajput2424@axl"),
  upiPrimaryId: cleanEnv(process.env.UPI_PRIMARY_ID, "abhinavrajput2424@axl"),
  upiPrimaryLabel: cleanEnv(process.env.UPI_PRIMARY_LABEL, "Primary UPI"),
  upiBackupId: cleanEnv(process.env.UPI_BACKUP_ID, "abhinavrajput24241@ybl"),
  upiBackupLabel: cleanEnv(process.env.UPI_BACKUP_LABEL, "Backup UPI"),
  paymentRouteRotationSize: Number(cleanEnv(process.env.PAYMENT_ROUTE_ROTATION_SIZE, 15)),
  notePrice: Number(cleanEnv(process.env.NOTE_PRICE, 199)),
  referralReward: Number(cleanEnv(process.env.REFERRAL_REWARD, 40)),
  referralJoinBonus: Number(cleanEnv(process.env.REFERRAL_JOIN_BONUS, 10)),
  minWithdrawal: Number(cleanEnv(process.env.MIN_WITHDRAWAL, 150)),
  defaultProductCategory: cleanEnv(process.env.DEFAULT_PRODUCT_CATEGORY, "Academic"),
  privateChannelId: cleanEnv(process.env.PRIVATE_CHANNEL_ID),
  privateChannelInviteLink: cleanEnv(process.env.PRIVATE_CHANNEL_INVITE_LINK),
  limitedTimeBonusLabel: cleanEnv(process.env.LIMITED_TIME_BONUS_LABEL, "Limited time bonus active"),
  companyName: cleanEnv(process.env.COMPANY_NAME, "Raptorvoid Private Limited"),
  aiNotesPdfUrl: cleanEnv(process.env.AI_NOTES_PDF_URL, aiNotesPdfDefaultUrl),
  aiNotesPdfVersion: cleanEnv(process.env.AI_NOTES_PDF_VERSION, "v1.0"),
  aiNotesPdfFileSizeLabel: cleanEnv(process.env.AI_NOTES_PDF_FILE_SIZE_LABEL, "351 pages")
};

let productionConfigChecked = false;

export function assertProductionConfig() {
  if (!isProd || productionConfigChecked) {
    return;
  }
  productionConfigChecked = true;

  const errors = [];
  if (!env.telegramBotToken) {
    errors.push("TELEGRAM_BOT_TOKEN is required in production");
  }
  if (!env.jwtSecret || env.jwtSecret.length < 32) {
    errors.push("JWT_SECRET is required in production and must be at least 32 characters");
  }
  if (!env.adminApiKey || env.adminApiKey === "change-me") {
    errors.push("ADMIN_API_KEY must be set to a strong secret in production (not the default)");
  }
  if (env.adminTelegramIds.length === 0) {
    errors.push("ADMIN_TELEGRAM_IDS must be set in production so admin review messages can be delivered");
  }

  if (errors.length) {
    throw new Error(`Invalid production configuration:\n- ${errors.join("\n- ")}`);
  }
}

if (isProd) {
  assertProductionConfig();
}
