import { getBotRuntime, handleWebhookUpdate, verifyTelegramWebhookRequest } from "../src/runtime.js";

function getUpdatePayload(req) {
  if (typeof req.body === "string") {
    return JSON.parse(req.body || "{}");
  }
  return req.body || {};
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const querySecret = req.query?.secret || "";
    if (!verifyTelegramWebhookRequest({ headers: req.headers || {}, querySecret })) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const update = getUpdatePayload(req);
    const runtime = await getBotRuntime({ polling: false });
    await handleWebhookUpdate(update, runtime);
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook failed", error);
    return res.status(500).json({ message: error?.message || "Webhook processing failed" });
  }
}
