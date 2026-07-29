import mongoose from "mongoose";

const withdrawalRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    amount: {
      type: Number,
      required: true
    },
    upiId: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "paid", "rejected"],
      default: "pending",
      index: true
    },
    processedAt: Date,
    processedBy: String,
    adminNote: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

withdrawalRequestSchema.index({ status: 1, createdAt: -1 });
withdrawalRequestSchema.index({ user: 1, status: 1, createdAt: -1 });

export const WithdrawalRequest = mongoose.model("WithdrawalRequest", withdrawalRequestSchema);
