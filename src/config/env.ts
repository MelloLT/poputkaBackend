import * as dotenv from "dotenv";
import crypto from "crypto";
import { z } from "zod";

dotenv.config();

const bool = z
  .enum(["true", "false", "1", "0"])
  .optional()
  .transform((v) => v === "true" || v === "1");

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 chars").optional(),
  FRONTEND_URL: z.string().optional(),
  CORS_ORIGINS: z.string().optional(),
  PAYMENT_SERVICE_URL: z.string().optional(),
  // Общий секрет между backend и payment-service для внутренних вызовов
  INTERNAL_API_SECRET: z.string().min(16).optional(),
  // SMS gateway (раньше логин/пароль были захардкожены в коде)
  SMS_GATEWAY_URL: z.string().optional(),
  SMS_LOGIN: z.string().optional(),
  SMS_PASSWORD: z.string().optional(),
  // Явный opt-in: вернуть OTP-код в ответе API (только для тестового стенда!)
  OTP_DEBUG_MODE: bool,
  LOG_LEVEL: z.string().default("info"),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment configuration:");
  console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

const raw = parsed.data;
const isProd = raw.NODE_ENV === "production";

if (isProd && !raw.JWT_SECRET) {
  console.error("JWT_SECRET is required in production");
  process.exit(1);
}

const DEFAULT_ORIGINS = [
  "https://pop-utka.uz",
  "http://localhost:5173",
  "http://localhost:5174",
];

const extraOrigins = [raw.FRONTEND_URL, ...(raw.CORS_ORIGINS?.split(",") ?? [])]
  .map((o) => o?.trim().replace(/\/$/, ""))
  .filter((o): o is string => Boolean(o));

export const env = {
  nodeEnv: raw.NODE_ENV,
  isProd,
  port: raw.PORT,
  // В dev без секрета — случайный на процесс (токены не переживут рестарт), но не публичная константа
  jwtSecret: raw.JWT_SECRET ?? crypto.randomBytes(32).toString("hex"),
  jwtSecretIsEphemeral: !raw.JWT_SECRET,
  corsOrigins: Array.from(new Set([...DEFAULT_ORIGINS, ...extraOrigins])),
  paymentServiceUrl: raw.PAYMENT_SERVICE_URL,
  internalApiSecret: raw.INTERNAL_API_SECRET,
  sms: {
    url: raw.SMS_GATEWAY_URL,
    login: raw.SMS_LOGIN,
    password: raw.SMS_PASSWORD,
    enabled: Boolean(raw.SMS_GATEWAY_URL && raw.SMS_LOGIN && raw.SMS_PASSWORD),
  },
  otpDebugMode: raw.OTP_DEBUG_MODE,
  logLevel: raw.LOG_LEVEL,
} as const;
