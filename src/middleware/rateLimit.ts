import rateLimit from "express-rate-limit";
import { sendError } from "../utils/responseHelper";
import { ErrorCodes } from "../utils/errorCodes";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // 100 запросов с одного IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(res, ErrorCodes.TOO_MANY_REQUESTS_IP, 429);
  },
});

export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 час
  max: 10, // 10 попыток входа
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(res, ErrorCodes.TOO_MANY_LOGIN_ATTEMPTS, 429);
  },
});
