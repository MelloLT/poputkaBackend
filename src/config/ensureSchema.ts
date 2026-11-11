import sequelize from "./database";

/**
 * Идемпотентные изменения схемы, которые sequelize.sync({ force: false }) сам не делает
 * (sync не добавляет новые колонки в существующие таблицы).
 * Безопасно запускать при каждом старте.
 */
export const ensureSchema = async () => {
  await sequelize.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "lastSeenAt" TIMESTAMP WITH TIME ZONE');
  // Старые записи не заполняем: updatedAt меняется и без участия пользователя (уведомления и т.п.),
  // это завысило бы число «активных». Активность считается с момента внедрения.
};
