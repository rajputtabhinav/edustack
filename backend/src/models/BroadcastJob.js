import mongoose from "mongoose";

const broadcastJobSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending"
    },
    targetScope: {
      type: String,
      enum: ["all_users"],
      default: "all_users"
    },
    sentCount: {
      type: Number,
      default: 0
    },
    failedCount: {
      type: Number,
      default: 0
    },
    createdBy: {
      type: String,
      default: "admin"
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

export const BroadcastJob = mongoose.model("BroadcastJob", broadcastJobSchema);
