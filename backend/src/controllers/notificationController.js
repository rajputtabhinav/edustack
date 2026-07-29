import { User } from "../models/User.js";
import { getUserNotifications, markNotificationRead } from "../services/notificationService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listMyNotifications = asyncHandler(async (req, res) => {
  const user = await User.findOne({ telegramId: String(req.telegramUserId) }).select("_id");
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  const before = req.query.before ? new Date(String(req.query.before)) : undefined;
  const limit = req.query.limit ? Number(req.query.limit) : 50;
  const notifications = await getUserNotifications(user._id, {
    limit,
    before: before instanceof Date && !Number.isNaN(before.getTime()) ? before : undefined
  });

  res.json({
    notifications,
    nextBefore: notifications.length ? notifications[notifications.length - 1].createdAt : null
  });
});

export const markMyNotificationRead = asyncHandler(async (req, res) => {
  const user = await User.findOne({ telegramId: String(req.telegramUserId) }).select("_id");
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  const notification = await markNotificationRead(req.params.id, user._id);

  if (!notification) {
    return res.status(404).json({ message: "Notification not found" });
  }

  res.json({ notification });
});
