import mongoose from "mongoose";
import { NOTE_PRICE } from "../constants/business.js";
import { PaymentRequest } from "../models/PaymentRequest.js";
import { Purchase } from "../models/Purchase.js";
import { Transaction } from "../models/Transaction.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { grantChannelAccess } from "./channelAccessService.js";
import { createNotification } from "./notificationService.js";
import { resolvePaymentRoute } from "./paymentRouteService.js";
import { getDefaultProduct, getProductById } from "./productService.js";
import { rewardReferrerIfEligible } from "./referralService.js";

export async function createPaymentRequest({ telegramId, screenshotFileName = "", screenshotMimeType = "", productId, paymentRouteKey }) {
  const user = await User.findOne({ telegramId: String(telegramId) });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const product = productId ? await getProductById(productId) : await getDefaultProduct();

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  const existingPurchase = await Purchase.findOne({
    user: user._id,
    product: product._id
  });

  if (existingPurchase) {
    throw new AppError("This product has already been purchased");
  }

  const paymentRoute = await resolvePaymentRoute(paymentRouteKey, NOTE_PRICE);

  return PaymentRequest.create({
    user: user._id,
    amount: NOTE_PRICE,
    screenshotFileName,
    screenshotMimeType,
    product: product._id,
    paymentRouteKey: paymentRoute?.key || "",
    paymentRouteLabel: paymentRoute?.label || ""
  });
}

export async function verifyPaymentRequest({ paymentRequestId, approved, reviewedBy, adminNote, context = {} }) {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const payment = await PaymentRequest.findById(paymentRequestId).session(session);

    if (!payment) {
      throw new AppError("Payment request not found", 404);
    }

    if (payment.status !== "pending") {
      throw new AppError("Payment request already processed");
    }

    const user = await User.findById(payment.user).session(session);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    payment.status = approved ? "approved" : "rejected";
    payment.reviewedAt = new Date();
    payment.reviewedBy = reviewedBy;
    payment.adminNote = adminNote || "";

    if (approved) {
      const product = payment.product ? await getProductById(payment.product) : await getDefaultProduct();

      if (!product) {
        throw new AppError("Product not found", 404);
      }

      const firstPurchaseUnlock = !user.hasPurchased;

      if (firstPurchaseUnlock) {
        user.hasPurchased = true;
        user.verifiedBadge = true;
      }
      await user.save({ session });

      await Transaction.create(
        [
          {
            user: user._id,
            type: "purchase",
            amount: payment.amount || NOTE_PRICE,
            direction: "debit",
            description: `${product.name} unlocked`,
            metadata: {
              paymentRequestId: payment._id,
              productId: product._id
            }
          }
        ],
        { session }
      );

      await Purchase.create(
        [
          {
            user: user._id,
            product: product._id,
            paymentRequest: payment._id,
            amount: payment.amount
          }
        ],
        { session }
      );

      if (product.accessType === "private_channel" || product.accessType === "mixed") {
        await grantChannelAccess(user, session);
      }

      if (firstPurchaseUnlock) {
        await rewardReferrerIfEligible(user, session, context);
      }

      await createNotification(
        {
          user: user._id,
          type: "payment_approved",
          title: "Payment approved",
          message: `${product.name} is now unlocked for your account.`,
          metadata: {
            paymentRequestId: payment._id,
            productId: product._id,
            reviewedAt: payment.reviewedAt
          }
        },
        session
      );
    } else {
      await createNotification(
        {
          user: user._id,
          type: "payment_rejected",
          title: "Payment needs review",
          message: adminNote || "Your payment proof was rejected. Please upload a valid screenshot and try again.",
          metadata: {
            paymentRequestId: payment._id,
            reviewedAt: payment.reviewedAt
          }
        },
        session
      );
    }

    await payment.save({ session });
    await session.commitTransaction();

    return payment;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
