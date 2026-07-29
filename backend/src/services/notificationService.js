import { Notification } from "../models/Notification.js";

export async function createNotification(payload, session) {
  if (session) {
    const [notification] = await Notification.create([payload], { session });
    return notification;
  }

  return Notification.create(payload);
}

export async function createNotifications(payloads, session) {
  if (!payloads.length) {
    return [];
  }

  if (session) {
    return Notification.create(payloads, { session });
  }

  return Notification.create(payloads);
}

export async function getUserNotifications(userId, { limit = 20, before } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const query = { user: userId };

  if (before) {
    query.createdAt = { $lt: before };
  }

  return Notification.find(query).sort({ createdAt: -1 }).limit(safeLimit).lean();
}

export async function markNotificationRead(notificationId, userId) {
  return Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { readAt: new Date() },
    { new: true }
  ).lean();
}

export async function markNotificationsAsSent(userId, type) {
  return Notification.updateMany(
    { user: userId, type, botSentAt: null },
    { $set: { botSentAt: new Date() } }
  );
}
