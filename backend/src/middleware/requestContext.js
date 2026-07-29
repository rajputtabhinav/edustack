import crypto from "crypto";

export function requestContext(req, res, next) {
  const forwarded = req.headers["x-forwarded-for"];
  const ipAddress = Array.isArray(forwarded) ? forwarded[0] : String(forwarded || req.ip || "").split(",")[0].trim();
  const rawFingerprint =
    req.headers["x-device-fingerprint"] ||
    req.headers["user-agent"] ||
    `${ipAddress}:${req.headers["sec-ch-ua-platform"] || "unknown"}`;

  req.context = {
    ipAddress,
    deviceFingerprint: crypto.createHash("sha256").update(String(rawFingerprint)).digest("hex")
  };

  next();
}
