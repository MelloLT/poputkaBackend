import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import path from "path";
import { env } from "./config/env";
import { apiLimiter } from "./middleware/rateLimit";
import { logger } from "./config/logger";
import { sendSuccess } from "./utils/responseHelper";
import authRoutes from "./routes/auth";
import tripRoutes from "./routes/trips";
import userRoutes from "./routes/users";
import bookingRoutes from "./routes/bookings";
import uploadRoutes from "./routes/upload";
import driverBookingsRoutes from "./routes/driverBookings";
import chatRoutes from "./routes/chats";
import reviewRoutes from "./routes/reviews";
import otpRouter from "./routes/otp";
import mapRoutes from "./routes/map";
import notificationRoutes from "./routes/notifications";
import paymentRoutes from "./routes/payment";
import passwordRoutes from "./routes/password";
import adminRoutes from "./routes/admin";

/** Express-приложение без запуска сервера и подключения к БД — удобно для тестов (supertest). */
export const createApp = () => {
  const app = express();
  // За reverse-proxy (nginx и т.п.) — корректный IP для rate-limit
  app.set("trust proxy", 1);

  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(compression());
  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(apiLimiter);

  app.use("/auth", authRoutes);
  app.use("/trips", tripRoutes);
  app.use("/users", userRoutes);
  app.use("/bookings", bookingRoutes);
  app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
  app.use("/upload", uploadRoutes);
  app.use("/driver/bookings", driverBookingsRoutes);
  app.use("/map", mapRoutes);
  app.use("/reviews", reviewRoutes);
  app.use("/notifications", notificationRoutes);
  app.use("/otp", otpRouter);
  app.use("/chats", chatRoutes);
  app.use("/admin", adminRoutes);
  app.use("/api/payment", paymentRoutes);
  app.use("/pass", passwordRoutes);

  app.get("/", (_req, res) =>
    sendSuccess(
      res,
      { endpoints: { auth: "/auth", trips: "/trips", users: "/users" } },
      "API_INFO",
      200,
    ),
  );

  app.get("/health", (_req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
  });

  // 404
  app.use((_req, res) => {
    res.status(404).json({ success: false, message: "NOT_FOUND" });
  });

  // Общий обработчик ошибок
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    logger.error({ err, method: req.method, url: req.originalUrl }, "Unhandled error");
    if (res.headersSent) return;
    const status = err.status || err.statusCode || 500;
    res.status(status).json({
      success: false,
      message: status === 500 ? "INTERNAL_SERVER_ERROR" : err.message,
    });
  });

  return app;
};
