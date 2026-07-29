import { createApp } from "./app.js";
import { connectDatabase } from "./config/db.js";
import { env } from "./config/env.js";

async function bootstrap() {
  await connectDatabase();
  const app = createApp();

  app.listen(env.port, () => {
    console.log(`EduStack backend running on port ${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start backend", error);
  process.exit(1);
});
