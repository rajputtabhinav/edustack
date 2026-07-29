import QRCode from "qrcode";
import { env } from "../config/env.js";
import { PaymentRequest } from "../models/PaymentRequest.js";

function buildUpiPayload(upiId, amount, label) {
  const params = new URLSearchParams({
    pa: upiId,
    pn: "EduStack",
    am: String(amount),
    cu: "INR",
    tn: `${label} checkout`
  });

  return `upi://pay?${params.toString()}`;
}

export function getPaymentRouteDefinitions() {
  return [
    {
      key: "primary",
      label: env.upiPrimaryLabel,
      upiId: env.upiPrimaryId
    },
    {
      key: "backup",
      label: env.upiBackupLabel,
      upiId: env.upiBackupId
    }
  ].filter((route) => route.upiId);
}

function toPublicRoute(route, amount, sequenceNumber, rotationSize, paymentCount) {
  return {
    key: route.key,
    label: route.label,
    amount,
    sequenceNumber,
    rotationSize,
    paymentCount
  };
}

export function getPaymentRouteByKey(routeKey) {
  return getPaymentRouteDefinitions().find((route) => route.key === String(routeKey || "").toLowerCase()) || null;
}

export async function getActivePaymentRoute(amount = env.notePrice) {
  const routes = getPaymentRouteDefinitions();
  if (!routes.length) {
    return null;
  }

  const paymentCount = await PaymentRequest.countDocuments({});
  const rotationSize = Math.max(1, Number(env.paymentRouteRotationSize) || 15);
  const routeIndex = Math.floor(paymentCount / rotationSize) % routes.length;
  const sequenceNumber = routeIndex + 1;

  return toPublicRoute(routes[routeIndex], amount, sequenceNumber, rotationSize, paymentCount);
}

export async function resolvePaymentRoute(routeKey, amount = env.notePrice) {
  const rotationSize = Math.max(1, Number(env.paymentRouteRotationSize) || 15);
  if (routeKey) {
    const route = getPaymentRouteByKey(routeKey);
    if (route) {
      const paymentCount = await PaymentRequest.countDocuments({});
      const sequenceNumber = getPaymentRouteDefinitions().findIndex((entry) => entry.key === route.key) + 1;
      return toPublicRoute(route, amount, sequenceNumber, rotationSize, paymentCount);
    }
  }

  return getActivePaymentRoute(amount);
}

export async function generatePaymentQrBuffer(routeKey, amount = env.notePrice) {
  const route = getPaymentRouteByKey(routeKey);
  if (!route?.upiId) {
    return null;
  }

  const payload = buildUpiPayload(route.upiId, amount, route.label);
  return QRCode.toBuffer(payload, {
    type: "png",
    width: 720,
    margin: 1,
    color: {
      dark: "#0F172A",
      light: "#F8FAFC"
    }
  });
}
