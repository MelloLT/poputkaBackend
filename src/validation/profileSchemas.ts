import { z } from "zod";

// Базовые схемы валидации
export const profileSchemas = {
  // Простые поля - минимум проверок
  about: z.string().max(1000, "Максимум 1000 символов").optional().nullable(),

  firstName: z
    .string()
    .min(1, "Имя обязательно")
    .max(50, "Максимум 50 символов")
    .optional(),

  lastName: z
    .string()
    .min(1, "Фамилия обязательна")
    .max(50, "Максимум 50 символов")
    .optional(),

  gender: z.enum(["male", "female"]).optional().nullable(),

  telegram: z
    .string()
    .regex(/^@?[a-zA-Z0-9_]{5,32}$/, "Неверный формат Telegram")
    .transform((val) => (val.startsWith("@") ? val : `@${val}`))
    .optional()
    .nullable(),

  // Email - только проверка на наличие @ и .
  email: z.string().email("Неверный формат email").optional(),

  // Телефон - просто убираем пробелы и проверяем длину
  phone: z
    .string()
    .transform((val) => val.replace(/\s/g, ""))
    .refine((val) => /^\+?[0-9]{11,15}$/.test(val), "Неверный формат телефона")
    .optional(),

  // Дата рождения - просто проверяем что это дата и возраст > 18
  birthDate: z
    .string()
    .refine((val) => {
      const date = new Date(val);
      if (isNaN(date.getTime())) return false;
      const age = new Date().getFullYear() - date.getFullYear();
      return age >= 18;
    }, "Возраст должен быть не менее 18 лет")
    .optional(),
};

// Тип для обновления профиля
export type ProfileUpdateInput = {
  [K in keyof typeof profileSchemas]?: z.infer<(typeof profileSchemas)[K]>;
};

// Словарь валидаторов - O(1) доступ вместо if/else
export const validators: Record<string, z.ZodSchema> = profileSchemas;
