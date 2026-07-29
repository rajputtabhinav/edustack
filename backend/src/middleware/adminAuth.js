import { env } from "../config/env.js";

export function requireAdmin(req, res, next) {
  const key = req.headers["x-admin-key"];

  if (!key || key !== env.adminApiKey) {
    return res.status(401).json({ message: "Unauthorized admin request" });
  }

  next();
}
