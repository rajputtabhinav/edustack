import crypto from "crypto";
import { AppError } from "./AppError.js";

const MAX_AUTH_AGE_SEC = 86400;

/**
 * Validates Telegram Web App initData per https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 * @returns {{ telegramId: string, username: string, firstName: string, startParam: string }}
 */
export function validateTelegramInitData(initData, botToken) {
  if (!initData || typeof initData !== "string") {
    throw new AppError("Telegram initData is required", 401);
  }

  if (!botToken) {
    throw new AppError("Server is missing Telegram bot configuration", 500);
  }

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) {
    throw new AppError("Invalid Telegram initData", 401);
  }

  const authDateRaw = params.get("auth_date");
  const authDate = authDateRaw ? Number(authDateRaw) : 0;
  if (!authDate || !Number.isFinite(authDate)) {
    throw new AppError("Invalid Telegram auth_date", 401);
  }

  const now = Math.floor(Date.now() / 1000);
  if (now - authDate > MAX_AUTH_AGE_SEC) {
    throw new AppError("Telegram session expired. Close and reopen the app from Telegram.", 401);
  }

  params.delete("hash");
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const calculatedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  let expected;
  let received;
  try {
    expected = Buffer.from(calculatedHash, "hex");
    received = Buffer.from(hash, "hex");
  } catch {
    throw new AppError("Telegram initData signature invalid", 401);
  }
  if (expected.length !== received.length || expected.length !== 32 || !crypto.timingSafeEqual(expected, received)) {
    throw new AppError("Telegram initData signature invalid", 401);
  }

  const userJson = params.get("user");
  if (!userJson) {
    throw new AppError("Telegram user missing from initData", 401);
  }

  let user;
  try {
    user = JSON.parse(userJson);
  } catch {
    throw new AppError("Invalid Telegram user payload", 401);
  }

  const id = user?.id;
  if (id === undefined || id === null) {
    throw new AppError("Telegram user id missing", 401);
  }

  const startParam = params.get("start_param") || "";

  return {
    telegramId: String(id),
    username: user.username || "",
    firstName: user.first_name || "",
    startParam
  };
}
