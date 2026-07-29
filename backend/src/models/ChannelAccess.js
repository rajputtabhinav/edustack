import mongoose from "mongoose";

const channelAccessSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    inviteLink: {
      type: String,
      default: ""
    },
    status: {
      type: String,
      enum: ["pending", "granted", "revoked"],
      default: "pending"
    },
    grantedAt: Date,
    revokedAt: Date
  },
  {
    timestamps: true
  }
);

export const ChannelAccess = mongoose.model("ChannelAccess", channelAccessSchema);
