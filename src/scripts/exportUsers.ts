// Выгрузка отчёта по пользователям в файл, без сервера и без входа в админку.
//   npm run report:users                -> ./reports/pop-utka-users-ГГГГ-ММ-ДД.xlsx
//   npm run report:users -- ~/Desktop   -> в указанную папку
// Берёт подключение к базе из .env (DATABASE_URL или DB_*).
import fs from "fs";
import path from "path";
import sequelize from "../config/database";
import { ensureSchema } from "../config/ensureSchema";
import { buildUsersWorkbook } from "../services/userReport";

const main = async () => {
  const dir = path.resolve(process.argv[2] ?? "reports");
  fs.mkdirSync(dir, { recursive: true });
  await sequelize.authenticate();
  await ensureSchema();
  const wb = await buildUsersWorkbook();
  const date = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tashkent" });
  const file = path.join(dir, `pop-utka-users-${date}.xlsx`);
  await wb.xlsx.writeFile(file);
  console.log(`Готово: ${file}`);
  await sequelize.close();
};

main().catch(async (err) => {
  console.error("Не удалось сформировать отчёт:", err);
  await sequelize.close().catch(() => undefined);
  process.exit(1);
});
