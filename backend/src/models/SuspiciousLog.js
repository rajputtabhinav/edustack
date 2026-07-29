import mongoose from "mongoose";

const suspiciousLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    telegramId: {
      type: String,
      default: ""
    },
    reason: {
      type: String,
      required: true,
      index: true
    },
    ipAddress: {
      type: String,
      default: ""
    },
    deviceFingerprint: {
      type: String,
      default: ""
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

suspiciousLogSchema.index({ telegramId: 1, reason: 1, createdAt: -1 });

export const SuspiciousLog = mongoose.model("SuspiciousLog", suspiciousLogSchema);
