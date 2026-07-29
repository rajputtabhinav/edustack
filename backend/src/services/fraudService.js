import { SuspiciousLog } from "../models/SuspiciousLog.js";
import { User } from "../models/User.js";

export async function createSuspiciousLog(payload, session) {
  if (session) {
    await SuspiciousLog.create([payload], { session });
    return;
  }

  await SuspiciousLog.create(payload);
}

export async function updateUserContext(user, context = {}, session) {
  if (!user) {
    return;
  }

  if (context.ipAddress) {
    user.lastKnownIp = context.ipAddress;
  }

  if (context.deviceFingerprint) {
    user.deviceFingerprint = context.deviceFingerprint;
  }

  await user.save(session ? { session } : undefined);
}

export async function checkSuspiciousReferralSignals({ referrerId, referredUser, context, session }) {
  if (!referrerId || !referredUser) {
    return;
  }

  const referrer = await User.findById(referrerId).session(session);

  if (!referrer) {
    return;
  }

  if (context?.ipAddress && referrer.lastKnownIp && referrer.lastKnownIp === context.ipAddress) {
    await createSuspiciousLog(
      {
        user: referredUser._id,
        telegramId: referredUser.telegramId,
        reason: "shared_ip_referral",
        ipAddress: context.ipAddress,
        deviceFingerprint: context.deviceFingerprint || "",
        metadata: {
          referrerTelegramId: referrer.telegramId
        }
      },
      session
    );
  }

  if (
    context?.deviceFingerprint &&
    referrer.deviceFingerprint &&
    referrer.deviceFingerprint === context.deviceFingerprint
  ) {
    await createSuspiciousLog(
      {
        user: referredUser._id,
        telegramId: referredUser.telegramId,
        reason: "shared_device_referral",
        ipAddress: context.ipAddress || "",
        deviceFingerprint: context.deviceFingerprint,
        metadata: {
          referrerTelegramId: referrer.telegramId
        }
      },
      session
    );
  }
}
