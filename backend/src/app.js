import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { assertProductionConfig, env } from "./config/env.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import referralRoutes from "./routes/referralRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import withdrawalRoutes from "./routes/withdrawalRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { requestContext } from "./middleware/requestContext.js";

function corsDelegate() {
  if (env.nodeEnv !== "production") {
    return { origin: true, credentials: true };
  }

  const allowed = new Set(env.corsOrigins);

  return {
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowed.has(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true
  };
}

export function createApp() {
  if (env.nodeEnv === "production") {
    assertProductionConfig();
  }

  const app = express();
  app.set("trust proxy", 1);

  app.use(cors(corsDelegate()));
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan("dev"));
  app.use(requestContext);

  app.get("/health", (req, res) => {
    res.json({ ok: true });
  });

  app.use("/auth", authRoutes);
  app.use("/user", userRoutes);
  app.use("/payment", paymentRoutes);
  app.use("/withdraw", withdrawalRoutes);
  app.use("/referrals", referralRoutes);
  app.use("/leaderboard", leaderboardRoutes);
  app.use("/notifications", notificationRoutes);
  app.use("/products", productRoutes);
  app.use("/admin", adminRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
