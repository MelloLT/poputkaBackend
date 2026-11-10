import { Sequelize } from "sequelize";
import * as dotenv from "dotenv";
import { logger } from "./logger";

dotenv.config();

const { DATABASE_PUBLIC_URL, DATABASE_URL, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME } =
  process.env;

const remoteUrl = DATABASE_PUBLIC_URL || DATABASE_URL;
const hasLocalConfig = Boolean(DB_USER && DB_HOST && DB_NAME);

if (!remoteUrl && !hasLocalConfig && process.env.NODE_ENV !== "test") {
  logger.fatal(
    "No database configuration: set DATABASE_URL (Railway) or DB_USER/DB_PASSWORD/DB_HOST/DB_PORT/DB_NAME",
  );
  process.exit(1);
}

const databaseUrl =
  remoteUrl ??
  `postgres://${encodeURIComponent(DB_USER ?? "")}:${encodeURIComponent(DB_PASSWORD ?? "")}@${DB_HOST ?? "localhost"}:${DB_PORT ?? 5432}/${DB_NAME ?? "postgres"}`;

// Раньше здесь печатались первые 50 символов URL — вместе с логином и паролем БД. Теперь только хост.
try {
  logger.info({ host: new URL(databaseUrl).host, remote: Boolean(remoteUrl) }, "Database config");
} catch {
  logger.info({ remote: Boolean(remoteUrl) }, "Database config");
}

const sequelize = new Sequelize(databaseUrl, {
  dialect: "postgres",
  logging: process.env.NODE_ENV === "development" ? (sql: string) => logger.debug(sql) : false,
  dialectOptions: DATABASE_URL
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      }
    : {},
});

export default sequelize;
