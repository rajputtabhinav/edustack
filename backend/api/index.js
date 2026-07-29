import { createApp } from "../src/app.js";
import { connectDatabase } from "../src/config/db.js";

const app = createApp();
let dbPromise;

export default async function handler(req, res) {
  if (!dbPromise) {
    dbPromise = connectDatabase();
  }

  await dbPromise;
  return app(req, res);
}
