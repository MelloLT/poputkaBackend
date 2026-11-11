import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { sendError } from "../utils/responseHelper";

const safeEqual = (a: string, b: string) => {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
};

/**
 * Защита сервис-к-сервису (например, callback от payment-service).
 * Ожидает заголовок `x-internal-secret`. Если INTERNAL_API_SECRET не задан —
 * пропускаем (обратная совместимость), но при старте пишем предупреждение.
 */
export const requireInternalSecret = (req: Request, res: Response, next: NextFunction) => {
  if (!env.internalApiSecret) return next();

  const provided = req.header("x-internal-secret") ?? "";
  if (!safeEqual(provided, env.internalApiSecret)) {
    logger.warn({ ip: req.ip, path: req.path }, "internal endpoint: bad secret");
    return sendError(res, "FORBIDDEN", 403);
  }
  next();
};
