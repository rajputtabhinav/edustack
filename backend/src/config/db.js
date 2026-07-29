import mongoose from "mongoose";
import { env } from "./env.js";

let connectionPromise;

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  mongoose.set("strictQuery", true);
  connectionPromise = mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: env.mongoServerSelectionTimeoutMs,
    maxPoolSize: env.mongoMaxPoolSize,
    maxIdleTimeMS: 30000
  });

  try {
    await connectionPromise;
    return mongoose.connection;
  } finally {
    if (mongoose.connection.readyState !== 1) {
      connectionPromise = undefined;
    }
  }
}
