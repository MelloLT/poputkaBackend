const { QueryTypes } = require("sequelize");
const sequelize = require("../config/database");

const addBirthDateColumn = async () => {
  try {
    console.log("🔧 Проверяем наличие столбца birthDate...");

    // Проверяем существует ли уже столбец
    const checkColumn = await sequelize.query(
      `SELECT column_name 
       FROM information_schema.columns 
       WHERE table_name='users' AND column_name='birthDate'`,
      { type: QueryTypes.SELECT }
    );

    if (checkColumn.length === 0) {
      console.log("Добавляем столбец birthDate...");

      // Добавляем столбец с значением по умолчанию
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN "birthDate" VARCHAR(255) NOT NULL DEFAULT '2000-01-01'
      `);

      console.log("Столбец birthDate успешно добавлен");
    } else {
      console.log("Столбец birthDate уже существует");
    }
  } catch (error) {
    console.error("Ошибка при добавлении столбца:", error);
  }
};

// Запускаем миграцию
addBirthDateColumn();
