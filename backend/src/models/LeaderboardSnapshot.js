import mongoose from "mongoose";

const leaderboardEntrySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    telegramId: {
      type: String,
      required: true
    },
    displayName: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    rank: {
      type: Number,
      required: true
    }
  },
  { _id: false }
);

const leaderboardSnapshotSchema = new mongoose.Schema(
  {
    period: {
      type: String,
      enum: ["daily", "weekly", "all-time"],
      required: true,
      unique: true
    },
    entries: {
      type: [leaderboardEntrySchema],
      default: []
    },
    generatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

export const LeaderboardSnapshot = mongoose.model("LeaderboardSnapshot", leaderboardSnapshotSchema);
