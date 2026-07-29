import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    telegramId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    username: {
      type: String,
      default: ""
    },
    firstName: {
      type: String,
      default: ""
    },
    hasPurchased: {
      type: Boolean,
      default: false
    },
    balance: {
      type: Number,
      default: 0
    },
    lockedBalance: {
      type: Number,
      default: 0
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    referralsCount: {
      type: Number,
      default: 0
    },
    rewardGrantedForReferral: {
      type: Boolean,
      default: false
    },
    joinedReferralBonusGranted: {
      type: Boolean,
      default: false
    },
    xp: {
      type: Number,
      default: 0
    },
    badge: {
      type: String,
      default: "Beginner"
    },
    level: {
      type: Number,
      default: 1
    },
    verifiedBadge: {
      type: Boolean,
      default: false
    },
    currentStreak: {
      type: Number,
      default: 0
    },
    longestStreak: {
      type: Number,
      default: 0
    },
    lastActiveDate: {
      type: Date,
      default: null
    },
    totalStreakXp: {
      type: Number,
      default: 0
    },
    milestoneProgress: {
      type: Map,
      of: Number,
      default: {}
    },
    milestoneCompletedAt: {
      type: Map,
      of: Date,
      default: {}
    },
    challengeRewardsClaimed: {
      type: [String],
      default: []
    },
    totalReferralEarnings: {
      type: Number,
      default: 0,
      index: true
    },
    lastKnownIp: {
      type: String,
      default: ""
    },
    deviceFingerprint: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: true }
  }
);

userSchema.index({ totalReferralEarnings: -1 });
userSchema.index({ referredBy: 1, createdAt: -1 });
userSchema.index({ hasPurchased: 1, referralsCount: -1 });

export const User = mongoose.model("User", userSchema);
