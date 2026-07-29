import mongoose from "mongoose";

const bonusConfigSchema = new mongoose.Schema(
  {
    defaultReward: {
      type: Number,
      default: 40
    },
    activeBonus: {
      type: Number,
      default: 50
    },
    expiresAt: {
      type: Date,
      default: null
    },
    isActive: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

export const BonusConfig = mongoose.model("BonusConfig", bonusConfigSchema);
