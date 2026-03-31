import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import * as dotenv from "dotenv";
import sequelize from "./config/database";
import authRoutes from "./routes/auth";
import path from "path";
import verificationRoutes from "./routes/verification";
import Message from "./models/Message";
import tripRoutes from "./routes/trips";
import userRoutes from "./routes/users";
import bookingRoutes from "./routes/bookings";
import uploadRoutes from "./routes/upload";
import driverBookingsRoutes from "./routes/driverBookings";
import chatRoutes from "./routes/chats";
import reviewRoutes from "./routes/reviews";
import mapRoutes from "./routes/map";
import { setupAssociations } from "./models/associations";
import { Server } from "socket.io";
import notificationRoutes from "./routes/notifications";
import { socketAuthMiddleware } from "./middleware/socketAuth";
import { createServer } from "http";
import adminRoutes from "./routes/admin";
import citiesRoutes from "./routes/cities";

dotenv.config();

const app = express();
const PORT = 5001;
const server = createServer(app);

// ===== CORS =====
const allowedOrigins = ["https://pop-utka.uz", "http://localhost:5173"];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  }),
);

// Preflight для всех маршрутов
app.options("*", cors({ origin: allowedOrigins, credentials: true }));

// ===== Middleware =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ===== Socket.IO =====
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.use(socketAuthMiddleware);

io.on("connection", (socket) => {
  console.log("user connected", socket.data.user.username);

  socket.on("join-chat", (chatId: string) => {
    console.log(`${socket.data.user.id} joins chat ${chatId}`);
    socket.join(`chat:${chatId}`);
  });

  socket.on("send-message", async ({ chatId, text }) => {
    const userId = socket.data.user?.id;

    const message = await Message.create({
      chatId,
      senderId: userId,
      text,
    });

    io.to(`chat:${String(chatId)}`).emit("new-message", {
      id: message.id,
      chatId,
      senderId: userId,
      senderName: socket.data.user?.username || "Unknown",
      text,
      createdAt: message.createdAt,
    });
  });
});

// ===== Маршруты =====
app.use("/auth", authRoutes);
app.use("/verification", verificationRoutes);
app.use("/trips", tripRoutes);
app.use("/users", userRoutes);
app.use("/bookings", bookingRoutes);
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
app.use("/upload", uploadRoutes);
app.use("/driver/bookings", driverBookingsRoutes);
app.use("/map", mapRoutes);
app.use("/reviews", reviewRoutes);
app.use("/notifications", notificationRoutes);
app.use("/chats", chatRoutes);
app.use("/admin", adminRoutes);

// ===== Тестовые эндпоинты =====
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

app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// ===== Старт сервера =====
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected to PostgreSQL successfully");

    setupAssociations();

    await sequelize.sync({ force: false });
    console.log("Database synchronized");

    server.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Error connecting to PostgreSQL:", error);
  }
};

startServer();
