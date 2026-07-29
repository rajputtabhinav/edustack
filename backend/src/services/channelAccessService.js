import { env } from "../config/env.js";
import { ChannelAccess } from "../models/ChannelAccess.js";

export async function grantChannelAccess(user, session) {
  const payload = {
    user: user._id,
    inviteLink: env.privateChannelInviteLink,
    status: "granted",
    grantedAt: new Date()
  };

  const options = {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true
  };

  if (session) {
    options.session = session;
  }

  return ChannelAccess.findOneAndUpdate({ user: user._id }, payload, options);
}
