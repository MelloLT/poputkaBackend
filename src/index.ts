import { createServer } from "http";
import sequelize from "./config/database";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { createSocketServer } from "./socket";
import { setupAssociations } from "./models/associations";
import { ensureSchema } from "./config/ensureSchema";
import { createApp } from "./app";

const app = createApp();
const server = createServer(app);
const io = createSocketServer(server);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    logger.info("Connected to PostgreSQL");

    setupAssociations();
    await sequelize.sync({ force: false });
    await ensureSchema();
    logger.info("Database synchronized");

    if (env.jwtSecretIsEphemeral) {
      logger.warn("JWT_SECRET not set: using ephemeral secret, tokens reset on restart");
    }
    if (!env.internalApiSecret) {
      logger.warn("INTERNAL_API_SECRET not set: payment callback is NOT protected");
    }

    server.listen(env.port, () => logger.info(`Server listening on :${env.port}`));
  } catch (error) {
    logger.fatal({ err: error }, "Failed to start server");
    process.exit(1);
  }
};

const shutdown = (signal: string) => {
  logger.info({ signal }, "Shutting down");
  const force = setTimeout(() => process.exit(1), 10_000);
  force.unref();
  // io.close() закрывает и http-сервер
  io.close(async () => {
    await sequelize.close().catch(() => undefined);
    process.exit(0);
  });
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => logger.error({ reason }, "Unhandled rejection"));

startServer();
