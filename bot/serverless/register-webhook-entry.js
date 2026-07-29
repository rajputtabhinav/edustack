import { botEnv } from "../src/config.js";
import { getBotRuntime, getWebhookUrl } from "../src/runtime.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const authHeader = String(req.headers.authorization || req.headers.Authorization || "");
    if (!botEnv.adminApiKey || authHeader !== `Bearer ${botEnv.adminApiKey}`) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!botEnv.webhookSecret) {
      return res.status(400).json({ message: "TELEGRAM_WEBHOOK_SECRET is required" });
    }

    const { bot } = await getBotRuntime({ polling: false });
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers.host;
    const baseUrl = botEnv.webhookBaseUrl || `${protocol}://${host}`;
    const webhookUrl = getWebhookUrl(baseUrl);

    const response = await bot.setWebHook(webhookUrl, {
      allowed_updates: ["message", "callback_query"]
    });

    return res.status(200).json({
      ok: true,
      webhookUrl,
      telegramAccepted: response
    });
  } catch (error) {
    console.error("Webhook registration failed", error);
    return res.status(500).json({ message: error?.message || "Webhook registration failed" });
  }
}
