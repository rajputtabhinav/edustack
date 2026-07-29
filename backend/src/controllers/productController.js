import { getActiveProducts, getAuthorizedDownloadProduct } from "../services/productService.js";
import { signProductDownloadToken, verifyProductDownloadToken } from "../services/tokenService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Readable } from "node:stream";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

function getDownloadBaseUrl(req) {
  const forwardedProto = String(req.get("x-forwarded-proto") || "").split(",")[0].trim();
  const forwardedHost = String(req.get("x-forwarded-host") || "").split(",")[0].trim();
  const protocol = forwardedProto || req.protocol || "https";
  const host = forwardedHost || req.get("host");
  const safeProtocol = protocol === "http" && process.env.NODE_ENV === "production" ? "https" : protocol;

  return `${safeProtocol}://${host}`;
}

export const listProducts = asyncHandler(async (req, res) => {
  const products = await getActiveProducts();
  res.json({ products });
});

export const createMyProductDownloadLink = asyncHandler(async (req, res) => {
  const product = await getAuthorizedDownloadProduct({
    telegramId: req.telegramUserId,
    productId: req.params.id
  });

  const token = signProductDownloadToken({
    telegramId: req.telegramUserId,
    productId: product._id
  });

  res.json({
    url: `${getDownloadBaseUrl(req)}/products/download/${encodeURIComponent(token)}`
  });
});

export const sendMyProductToTelegramChat = asyncHandler(async (req, res) => {
  if (!env.telegramBotToken) {
    throw new AppError("Telegram bot is not configured right now.", 503);
  }

  const product = await getAuthorizedDownloadProduct({
    telegramId: req.telegramUserId,
    productId: req.params.id
  });

  const upstream = await fetch(product.downloadUrl);
  if (!upstream.ok) {
    throw new AppError("The PDF file could not be fetched right now.", 502);
  }

  const fileBuffer = Buffer.from(await upstream.arrayBuffer());
  const safeBaseName = String(product.name || "ai-master-notes")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const form = new FormData();
  form.append("chat_id", String(req.telegramUserId));
  form.append("caption", `${product.name} is ready in your Telegram chat.\n\nOpen the file here or save it from Telegram anytime.`);
  form.append(
    "document",
    new Blob([fileBuffer], { type: upstream.headers.get("content-type") || "application/pdf" }),
    `${safeBaseName || "ai-master-notes"}.pdf`
  );

  const telegramResponse = await fetch(`https://api.telegram.org/bot${env.telegramBotToken}/sendDocument`, {
    method: "POST",
    body: form
  });
  const telegramPayload = await telegramResponse.json().catch(() => null);

  if (!telegramResponse.ok || !telegramPayload?.ok) {
    throw new AppError("The PDF could not be sent to your Telegram chat right now.", 502);
  }

  res.json({
    message: "PDF sent to your Telegram chat."
  });
});

export const consumeProductDownloadLink = asyncHandler(async (req, res) => {
  const { telegramId, productId } = verifyProductDownloadToken(req.params.token);
  const product = await getAuthorizedDownloadProduct({ telegramId, productId });

  const upstream = await fetch(product.downloadUrl);

  if (!upstream.ok) {
    return res.status(502).json({ message: "The PDF file could not be fetched right now." });
  }

  const safeBaseName = String(product.name || "ai-master-notes")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  res.setHeader("Cache-Control", "private, max-age=300");
  res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/pdf");
  res.setHeader("Access-Control-Allow-Origin", "https://web.telegram.org");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Content-Disposition", `attachment; filename="${safeBaseName || "ai-master-notes"}.pdf"`);

  const upstreamLength = upstream.headers.get("content-length");
  if (upstreamLength) {
    res.setHeader("Content-Length", upstreamLength);
  }

  if (!upstream.body) {
    return res.status(502).json({ message: "The PDF file stream is not available right now." });
  }

  Readable.fromWeb(upstream.body).pipe(res);
});
