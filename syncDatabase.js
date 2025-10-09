const { Sequelize } = require("sequelize");

const sequelize = new Sequelize({
  database: "poputka",
  username: "postgres",
  password: "",
  host: "localhost",
  port: 5432,
  dialect: "postgres",
});

async function syncDatabase() {
  try {
    await sequelize.authenticate();
    console.log("Подключение к базе данных установлено");

    // Принудительно синхронизируем все модели с базой
    // { force: true } удалит и пересоздаст таблицы
    // { alter: true } изменит существующие таблицы
    await sequelize.sync({ alter: true });

    console.log("База данных синхронизирована с моделями");

    // Проверим обновленную структуру
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);

    console.log("Обновленная структура таблицы users:");
    columns.forEach((col) => {
      console.log(
        `  - ${col.column_name} (${col.data_type}) ${
          col.is_nullable === "YES" ? "NULL" : "NOT NULL"
        }`
      );
    });
  } catch (error) {
    console.error("Ошибка синхронизации:", error.message);
  } finally {
    await sequelize.close();
    console.log("Синхронизация завершена");
  }
}

syncDatabase();
