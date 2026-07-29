import mongoose from "mongoose";

const paymentRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
      index: true
    },
    amount: {
      type: Number,
      required: true
    },
    screenshotFileName: {
      type: String,
      default: ""
    },
    screenshotMimeType: {
      type: String,
      default: ""
    },
    telegramPhotoFileId: {
      type: String,
      default: ""
    },
    paymentRouteKey: {
      type: String,
      default: ""
    },
    paymentRouteLabel: {
      type: String,
      default: ""
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true
    },
    reviewedAt: Date,
    reviewedBy: String,
    adminNote: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

paymentRequestSchema.index({ status: 1, createdAt: -1 });
paymentRequestSchema.index({ user: 1, status: 1, createdAt: -1 });
paymentRequestSchema.index({ paymentRouteKey: 1, createdAt: -1 });

export const PaymentRequest = mongoose.model("PaymentRequest", paymentRequestSchema);
