import jwt from "jsonwebtoken";
import crypto from "crypto";
import type { CookieOptions } from "express";
import { env } from "../config/env";

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 дней

export interface TokenPayload {
  userId: string;
  userRole: string;
}

export const generateToken = (userId: string, userRole: string): string =>
  jwt.sign({ userId, userRole }, env.jwtSecret, { expiresIn: TOKEN_TTL_SECONDS });

export const verifyToken = (token: string): TokenPayload =>
  jwt.verify(token, env.jwtSecret) as TokenPayload;

/** Единые опции cookie для установки и очистки (домен только в проде, иначе localhost не работает). */
export const authCookieOptions = (): CookieOptions => ({
  path: "/",
  httpOnly: true,
  secure: env.isProd,
  sameSite: env.isProd ? "none" : "lax",
  ...(env.isProd ? { domain: ".pop-utka.uz" } : {}),
});

export const authCookieMaxAgeMs = TOKEN_TTL_SECONDS * 1000;

// ---- Токен сброса пароля (выдаётся только после успешной проверки OTP типа "recover") ----
const RESET_TOKEN_TTL_SECONDS = 10 * 60;

/** Отпечаток текущего хэша пароля: после смены пароля старый resetToken перестаёт подходить (одноразовость). */
export const passwordFingerprint = (passwordHash: string | null | undefined): string =>
  crypto.createHash("sha256").update(passwordHash ?? "").digest("hex").slice(0, 16);

export const signResetToken = (phone: string, passwordHash: string | null | undefined): string =>
  jwt.sign({ purpose: "password-reset", phone, pwv: passwordFingerprint(passwordHash) }, env.jwtSecret, {
    expiresIn: RESET_TOKEN_TTL_SECONDS,
  });

export const verifyResetToken = (token: string): { phone: string; pwv: string } => {
  const payload = jwt.verify(token, env.jwtSecret) as { purpose?: string; phone?: string; pwv?: string };
  if (payload.purpose !== "password-reset" || !payload.phone || !payload.pwv) {
    throw new Error("invalid reset token");
  }
  return { phone: payload.phone, pwv: payload.pwv };
};

// ---- Токен подтверждённого номера (выдаётся после успешной проверки OTP "register" / "change_phone") ----
// Раньше SMS-код проверялся только на фронте: /auth/register и смена телефона в профиле
// не знали, вводился ли код, и их можно было вызвать напрямую на чужой номер.
export type PhoneTokenPurpose = "register" | "change_phone";
const PHONE_TOKEN_TTL_SECONDS = 15 * 60;

/** Сравниваем номера только по цифрам: "+998 90 123-45-67" и "998901234567" — один номер */
export const phoneDigits = (phone: unknown): string => String(phone ?? "").replace(/\D/g, "");

export const signPhoneToken = (purpose: PhoneTokenPurpose, phone: string): string =>
  jwt.sign({ purpose: `phone-${purpose}`, phone: phoneDigits(phone) }, env.jwtSecret, {
    expiresIn: PHONE_TOKEN_TTL_SECONDS,
  });

/** true, если токен выдан для этого действия и именно этого номера */
export const isPhoneTokenValid = (token: unknown, purpose: PhoneTokenPurpose, phone: unknown): boolean => {
  if (typeof token !== "string" || !token) return false;
  try {
    const payload = jwt.verify(token, env.jwtSecret) as { purpose?: string; phone?: string };
    return payload.purpose === `phone-${purpose}` && !!payload.phone && payload.phone === phoneDigits(phone);
  } catch {
    return false;
  }
};
