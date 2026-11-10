import pino from "pino";
import { env } from "./env";

export const logger = pino({
  level: env.nodeEnv === "test" ? "silent" : env.logLevel,
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "*.password",
      "*.codeHash",
      "*.token",
    ],
    censor: "[redacted]",
  },
  transport: env.isProd
    ? undefined
    : { target: "pino-pretty", options: { colorize: true, translateTime: "SYS:HH:MM:ss" } },
});
