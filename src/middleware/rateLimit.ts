import rateLimit from "express-rate-limit";
import { sendError } from "../utils/responseHelper";
import { ErrorCodes } from "../utils/errorCodes";

// Общий лимит на API (SPA делает много запросов, поэтому щедро)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  // статика и health-check не должны съедать лимит
  skip: (req) => req.path.startsWith("/uploads/") || req.path === "/health",
  handler: (_req, res) => sendError(res, ErrorCodes.TOO_MANY_REQUESTS_IP, 429),
});

// Логин / регистрация / проверки — защита от перебора паролей
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (_req, res) => sendError(res, ErrorCodes.TOO_MANY_LOGIN_ATTEMPTS, 429),
});

// Отправка OTP: ограничиваем по IP+телефону (защита от SMS-флуда и расходов на SMS)
export const otpSendLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip}:${String(req.body?.phone ?? "")}`,
  validate: { keyGeneratorIpFallback: false },
  handler: (_req, res) => sendError(res, ErrorCodes.TOO_MANY_REQUESTS_IP, 429),
});

// Проверка OTP / сброс пароля
export const otpVerifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 15,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (_req, res) => sendError(res, ErrorCodes.TOO_MANY_LOGIN_ATTEMPTS, 429),
});
