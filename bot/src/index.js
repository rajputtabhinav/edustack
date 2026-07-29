import { getBotRuntime, runReminderCycle } from "./runtime.js";

const { bot } = await getBotRuntime({
  polling: true
});

setInterval(() => {
  runReminderCycle(bot).catch((error) => {
    console.error("Scheduled reminder cycle failed", error);
  });
}, 6 * 60 * 60 * 1000);

console.log("EduStack bot is running");
