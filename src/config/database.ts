import { Sequelize } from "sequelize";
import * as dotenv from "dotenv";

dotenv.config();

let databaseUrl;

if (process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL) {
  // Используем Railway базу если есть URL
  databaseUrl = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;
  console.log("Using Railway database");
} else {
  // Локальная база данных
  databaseUrl = `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
  console.log("Using local PostgreSQL database");
}

if (!databaseUrl) {
  console.error("No database configuration found");
  console.error(
    "Please set either DATABASE_URL for Railway or DB_* variables for local development"
  );
  process.exit(1);
}

console.log("Database URL:", databaseUrl.substring(0, 50) + "...");

const sequelize = new Sequelize(databaseUrl, {
  dialect: "postgres",
  logging: process.env.NODE_ENV === "development" ? console.log : false,
  dialectOptions: process.env.DATABASE_URL
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      }
    : {},
});

export default sequelize;
