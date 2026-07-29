import mongoose from "mongoose";

const challengeSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ""
    },
    targetCount: {
      type: Number,
      required: true
    },
    rewardAmount: {
      type: Number,
      required: true
    },
    period: {
      type: String,
      enum: ["weekly", "custom"],
      default: "weekly"
    },
    isActive: {
      type: Boolean,
      default: true
    },
    startAt: {
      type: Date,
      default: null
    },
    endAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

export const Challenge = mongoose.model("Challenge", challengeSchema);
