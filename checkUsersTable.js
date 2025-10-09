const { Sequelize } = require("sequelize");

const sequelize = new Sequelize({
  database: "poputka",
  username: "postgres",
  password: "",
  host: "localhost",
  port: 5432,
  dialect: "postgres",
});

async function checkTable() {
  try {
    await sequelize.authenticate();
    console.log("Подключение к базе данных установлено");

    // Проверим структуру таблицы users
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);

    console.log("Структура таблицы users:");
    columns.forEach((col) => {
      console.log(
        `  - ${col.column_name} (${col.data_type}) ${
          col.is_nullable === "YES" ? "NULL" : "NOT NULL"
        }`
      );
    });

    // Проверим есть ли данные в таблице
    const [userCount] = await sequelize.query(
      "SELECT COUNT(*) as count FROM users"
    );
    console.log("Количество пользователей:", userCount[0].count);
  } catch (error) {
    console.error("Ошибка:", error.message);
  } finally {
    await sequelize.close();
    console.log("Проверка завершена");
  }
}

checkTable();
