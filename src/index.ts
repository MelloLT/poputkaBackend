import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import * as dotenv from "dotenv";
import sequelize from "./config/database";
import authRoutes from "./routes/auth";
import verificationRoutes from "./routes/verification";
import tripRoutes from "./routes/trips";
import userRoutes from "./routes/users";
import bookingRoutes from "./routes/bookings";
import uploadRoutes from "./routes/upload";
import driverBookingsRoutes from "./routes/driverBookings";
import mapRoutes from "./routes/map";
import { config } from "dotenv";
config();

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: ["https://pop-utka.vercel.app", "http://localhost:5173"],
    credentials: true, // ✅ важно!
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  })
);
app.use(express.json());
app.use(cookieParser()); // Добавляем cookie-parser

// Маршруты
app.use("/auth", authRoutes);
app.use("/verification", verificationRoutes);
app.use("/trips", tripRoutes);
app.use("/users", userRoutes);
app.use("/bookings", bookingRoutes);
app.use("/uploads", express.static("src/uploads"));
app.use("/upload", uploadRoutes);
app.use("/driver/bookings", driverBookingsRoutes);
app.use("/map", mapRoutes);

// Базовые эндпоинты
app.get("/", (req, res) => {
  res.json({
    message: "Бэкенд Poputka работает.",
    endpoints: {
      auth: "/auth",
      trips: "/trips",
      users: "/users",
      verification: "/verification",
    },
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected to PostgreSQL successfully");

    await sequelize.sync({ force: false });
    console.log("Database synchronized");

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(`Cookies enabled: YES`);
      console.log(`JWT Auth: YES`);
    });
  } catch (error) {
    console.error("Error connecting to PostgreSQL:", error);
  }
};

console.log("Environment check:");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("PORT:", process.env.PORT);
console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
console.log("DATABASE_URL length:", process.env.DATABASE_URL?.length);

startServer();
