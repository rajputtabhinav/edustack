import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ["purchase", "referral_reward", "referral_join_bonus", "referral_signup_bonus", "withdrawal", "milestone_bonus", "challenge_bonus", "leaderboard_bonus", "streak_xp_bonus"],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    direction: {
      type: String,
      enum: ["credit", "debit"],
      required: true
    },
    description: {
      type: String,
      required: true
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

transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ type: 1, createdAt: -1 });

export const Transaction = mongoose.model("Transaction", transactionSchema);
