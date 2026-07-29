import mongoose from "mongoose";

const leaderboardRewardSettlementSchema = new mongoose.Schema(
  {
    period: {
      type: String,
      enum: ["weekly"],
      required: true
    },
    periodKey: {
      type: String,
      required: true,
      unique: true
    },
    settledAt: {
      type: Date,
      default: Date.now
    },
    rewards: {
      type: [
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
          rank: {
            type: Number,
            required: true
          },
          amount: {
            type: Number,
            required: true
          }
        }
      ],
      default: []
    }
  },
  {
    timestamps: true
  }
);

export const LeaderboardRewardSettlement = mongoose.model("LeaderboardRewardSettlement", leaderboardRewardSettlementSchema);
