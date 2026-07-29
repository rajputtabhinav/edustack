import { env } from "../config/env.js";
import { signUserAccessToken } from "../services/tokenService.js";
import { createOrGetUser } from "../services/userService.js";
import { validateTelegramInitData } from "../utils/telegramWebAppAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getDashboardForTelegramId } from "./userController.js";

export const createSession = asyncHandler(async (req, res) => {
  const { initData } = req.body || {};

  const verified = validateTelegramInitData(initData, env.telegramBotToken);

  await createOrGetUser({
    telegramId: verified.telegramId,
    username: verified.username,
    firstName: verified.firstName,
    referredByTelegramId: verified.startParam || undefined,
    context: req.context
  });

  const token = signUserAccessToken(verified.telegramId);
  const dashboard = await getDashboardForTelegramId(verified.telegramId);

  res.status(201).json({
    token,
    ...dashboard
  });
});
