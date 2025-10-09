const { Sequelize } = require("sequelize");

console.log("Тестирование подключения к PostgreSQL...");

const sequelize = new Sequelize({
  database: "poputka",
  username: "postgres",
  password: "",
  host: "localhost",
  port: 5432,
  dialect: "postgres",
  logging: console.log,
});

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log("✅ Успешное подключение к PostgreSQL");

    // Проверим существование таблицы users
    const [results] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);

    console.log("Таблица users существует:", results[0].exists);

    if (results[0].exists) {
      const userCount = await sequelize.query("SELECT COUNT(*) FROM users");
      console.log("Количество пользователей в базе:", userCount[0][0].count);
    }
  } catch (error) {
    console.error("❌ Ошибка подключения к PostgreSQL:", error.message);
    console.error("Детали ошибки:", error);
  } finally {
    await sequelize.close();
    console.log("Тестирование завершено");
  }
}

testConnection();
