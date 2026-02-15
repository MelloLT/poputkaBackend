import { z } from "zod";

// Базовая схема для имени
const nameSchema = z
  .string()
  .min(2, "Минимум 2 символа")
  .max(50, "Максимум 50 символов")
  .regex(/^[A-Za-zА-Яа-яЁё\s]+$/, "Только буквы и пробелы");

// Telegram username (может быть пустым)
const telegramSchema = z
  .string()
  .regex(/^@?[a-zA-Z0-9_]{5,32}$/, "Неверный формат Telegram")
  .nullable()
  .optional()
  .transform((val) => (val ? (val.startsWith("@") ? val : `@${val}`) : null));

// Email (только базовая проверка на наличие @)
const emailSchema = z
  .string()
  .email("Неверный формат email")
  .toLowerCase()
  .optional();

// Телефон (простая проверка)
const phoneSchema = z
  .string()
  .regex(/^\+?[0-9]{10,15}$/, "Неверный формат телефона")
  .optional();

// Дата рождения
const birthDateSchema = z
  .string()
  .refine((date) => {
    const birthDate = new Date(date);
    const today = new Date();
    const minAgeDate = new Date(
      today.getFullYear() - 18,
      today.getMonth(),
      today.getDate(),
    );
    return birthDate <= minAgeDate && birthDate <= today;
  }, "Возраст должен быть не менее 18 лет и дата не в будущем")
  .optional();

// Пол
const genderSchema = z.enum(["male", "female"]).optional().nullable();

// About
const aboutSchema = z.string().max(1000, "Максимум 1000 символов").optional();

// Аватар (просто строка или null)
const avatarSchema = z.string().nullable().optional();

// Основная схема для обновления профиля
export const updateProfileSchema = z.object({
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  about: aboutSchema,
  telegram: telegramSchema,
  email: emailSchema,
  phone: phoneSchema,
  birthDate: birthDateSchema,
  gender: genderSchema,
  avatar: avatarSchema,
});

// Тип на основе схемы
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
