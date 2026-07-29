import { getBotRuntime, runReminderCycle, verifyCronRequest } from "../src/runtime.js";

export default async function handler(req, res) {
  if (!["GET", "POST"].includes(req.method)) {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    if (!verifyCronRequest(req.headers || {})) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { bot } = await getBotRuntime({ polling: false });
    const count = await runReminderCycle(bot);
    return res.status(200).json({ ok: true, remindersSent: count });
  } catch (error) {
    console.error("Reminder cron failed", error);
    return res.status(500).json({ message: error?.message || "Reminder execution failed" });
  }
}
