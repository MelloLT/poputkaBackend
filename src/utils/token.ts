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
