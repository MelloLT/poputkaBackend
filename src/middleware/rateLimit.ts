import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // 100 запросов с одного IP
  message: "Слишком много запросов с вашего IP, попробуйте позже",
});

export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 час
  max: 10, // 10 попыток входа
  message: "Слишком много попыток входа, попробуйте через час",
});
