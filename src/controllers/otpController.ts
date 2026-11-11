import bcrypt from "bcrypt";
import crypto from "crypto";
import axios from "axios";
import { z } from "zod";
import { Request, Response } from "express";
import OtpCode from "../models/OtpCode";
import User from "../models/User";
import { ErrorCodes } from "../utils/errorCodes";
import { sendError, sendSuccess } from "../utils/responseHelper";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { signResetToken } from "../utils/token";

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 3;

const OTP_TYPES = ["register", "recover", "change_phone", "login", "payment"] as const;
type OtpType = (typeof OTP_TYPES)[number];

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?\d{9,15}$/, "invalid phone");

const sendSchema = z.object({ phone: phoneSchema, type: z.enum(OTP_TYPES) });
const verifySchema = z.object({
  phone: phoneSchema,
  type: z.enum(OTP_TYPES),
  inputCode: z.coerce.string().regex(/^\d{6}$/),
});

const SMS_TEXTS: Partial<Record<OtpType, (code: string) => string>> = {
  register: (c) => `Pop-utka.uz: Avtorizatsiya tasdiqlash kodi — ${c}. Kodni hech kimga bermang.`,
  recover: (c) => `Pop-utka.uz: Parolni tiklash kodi — ${c}. Agar bu siz bo‘lmasangiz, xabarni e’tiborsiz qoldiring.`,
  change_phone: (c) => `Pop-utka.uz: Telefon raqamingizni o'zgartirish kodi — ${c}. Kodni hech kimga bermang.`,
};

export const sendSmsCode = async (phone: string, code: string, type: OtpType) => {
  if (!env.sms.enabled) throw new Error("SMS gateway is not configured");

  const text = (SMS_TEXTS[type] ?? SMS_TEXTS.register!)(code);
  const response = await axios.post(
    env.sms.url!,
    new URLSearchParams({
      login: env.sms.login!,
      password: env.sms.password!,
      data: JSON.stringify([{ phone, text }]),
    }),
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 10_000,
    },
  );
  return response.data;
};

export const sendOtpService = async (req: Request, res: Response) => {
  const parsed = sendSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, ErrorCodes.OTP_REQUIRED_FIELDS, 400);
  }
  const { phone, type } = parsed.data;

  try {
    const existing = await OtpCode.findOne({ where: { phone, type } });
    if (existing && Date.now() - existing.updatedAt.getTime() < OTP_RESEND_COOLDOWN_MS) {
      const retryAfterSec = Math.ceil(
        (OTP_RESEND_COOLDOWN_MS - (Date.now() - existing.updatedAt.getTime())) / 1000,
      );
      res.setHeader("Retry-After", String(retryAfterSec));
      return sendError(res, ErrorCodes.TOO_MANY_REQUESTS_IP, 429, { retryAfterSec });
    }

    // Криптостойкий генератор вместо Math.random()
    const code = crypto.randomInt(100000, 1000000).toString();
    const codeHash = await bcrypt.hash(code, 10);

    await OtpCode.upsert({
      phone,
      type,
      codeHash,
      attempts: 0,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
      maxAttempts: OTP_MAX_ATTEMPTS,
    });

    if (env.sms.enabled) {
      await sendSmsCode(phone, code, type);
      return sendSuccess(res, null, ErrorCodes.OTP_SENT_SUCCESS, 200);
    }

    if (env.otpDebugMode) {
      // Только тестовый стенд: явный opt-in через OTP_DEBUG_MODE=true
      logger.warn({ phone, type }, "OTP_DEBUG_MODE: returning code in response");
      return sendSuccess(res, { code }, ErrorCodes.OTP_SENT_SUCCESS, 200);
    }

    logger.error("OTP requested but SMS gateway is not configured and OTP_DEBUG_MODE is off");
    return sendError(res, ErrorCodes.OTP_SEND_ERROR, 503);
  } catch (e) {
    logger.error({ err: e, type }, "OTP send failed");
    return sendError(res, ErrorCodes.OTP_SEND_ERROR, 500);
  }
};

export const verifyOtpService = async (req: Request, res: Response) => {
  const parsed = verifySchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, ErrorCodes.OTP_REQUIRED_FIELDS, 400);
  }
  const { phone, type, inputCode } = parsed.data;

  try {
    const otp = await OtpCode.findOne({ where: { phone, type } });
    if (!otp) return sendError(res, ErrorCodes.OTP_NOT_FOUND, 404);

    if (new Date() > otp.expiresAt) {
      await otp.destroy();
      return sendError(res, ErrorCodes.OTP_EXPIRED, 410);
    }

    if (otp.attempts >= otp.maxAttempts) {
      await otp.destroy();
      return sendError(res, ErrorCodes.OTP_TOO_MANY_ATTEMPTS, 429);
    }

    const isValid = await bcrypt.compare(inputCode, otp.codeHash);
    if (!isValid) {
      await otp.update({ attempts: otp.attempts + 1 });
      return sendError(res, ErrorCodes.OTP_INVALID_CODE, 401, {
        attemptsLeft: Math.max(0, otp.maxAttempts - otp.attempts - 1),
      });
    }

    await otp.destroy();

    // После успешного "recover" выдаём короткоживущий токен — без него /pass/reset не работает
    let data: { resetToken: string } | null = null;
    if (type === "recover") {
      const user = await User.findOne({ where: { phone }, attributes: ["id", "password"] });
      if (!user) return sendError(res, ErrorCodes.USER_NOT_FOUND, 404);
      data = { resetToken: signResetToken(phone, user.password) };
    }
    return sendSuccess(res, data, ErrorCodes.OTP_VERIFIED_SUCCESS, 200);
  } catch (e) {
    logger.error({ err: e, type }, "OTP verify failed");
    return sendError(res, ErrorCodes.OTP_VERIFY_ERROR, 500);
  }
};
