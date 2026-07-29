import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema(
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
      required: true,
      index: true
    },
    paymentRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentRequest",
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ["approved"],
      default: "approved"
    }
  },
  {
    timestamps: true
  }
);

purchaseSchema.index({ user: 1, product: 1 });

export const Purchase = mongoose.model("Purchase", purchaseSchema);
