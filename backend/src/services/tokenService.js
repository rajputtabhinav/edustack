import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

const ISSUER = "edustack";

export function signUserAccessToken(telegramId) {
  return jwt.sign({ sub: String(telegramId), typ: "user" }, env.jwtSecret, {
    expiresIn: env.jwtExpiresSec,
    issuer: ISSUER
  });
}

export function verifyUserAccessToken(token) {
  if (!token || typeof token !== "string") {
    throw new AppError("Authentication required", 401);
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret, {
      issuer: ISSUER
    });

    const sub = payload?.sub;
    if (!sub || typeof sub !== "string") {
      throw new AppError("Invalid token", 401);
    }

    if (payload.typ !== "user") {
      throw new AppError("Invalid token", 401);
    }

    return { telegramId: sub };
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    throw new AppError("Session expired or invalid. Reopen from Telegram.", 401);
  }
}

export function signProductDownloadToken({ telegramId, productId }) {
  return jwt.sign(
    { sub: String(telegramId), productId: String(productId), typ: "product_download" },
    env.jwtSecret,
    {
      expiresIn: "10m",
      issuer: ISSUER
    }
  );
}

export function verifyProductDownloadToken(token) {
  if (!token || typeof token !== "string") {
    throw new AppError("Download link is missing or invalid", 401);
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret, {
      issuer: ISSUER
    });

    if (payload.typ !== "product_download" || !payload.sub || !payload.productId) {
      throw new AppError("Download link is invalid", 401);
    }

    return {
      telegramId: String(payload.sub),
      productId: String(payload.productId)
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Download link expired or invalid", 401);
  }
}
