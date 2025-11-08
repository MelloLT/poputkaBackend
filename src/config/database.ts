import { Sequelize } from "sequelize";
import * as dotenv from "dotenv";

dotenv.config();

// Используем публичный URL для Railway
const databaseUrl = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("No database URL found");
  process.exit(1);
}

console.log("Using database URL:", databaseUrl.substring(0, 50) + "...");

const sequelize = new Sequelize(databaseUrl, {
  dialect: "postgres",
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

export default sequelize;
