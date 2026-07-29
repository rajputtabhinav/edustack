import { verifyUserAccessToken } from "../services/tokenService.js";
import { AppError } from "../utils/AppError.js";

export function requireUserAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  const token = match?.[1];

  try {
    const { telegramId } = verifyUserAccessToken(token);
    req.telegramUserId = telegramId;
    next();
  } catch (err) {
    next(err instanceof AppError ? err : new AppError("Authentication required", 401));
  }
}
