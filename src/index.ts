import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import * as dotenv from "dotenv";
import sequelize from "./config/database";
import authRoutes from "./routes/auth";
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
import { config } from "dotenv";
import { Server } from "socket.io";
import notificationRoutes from "./routes/notifications";
import { socketAuthMiddleware } from "./middleware/socketAuth";

import { createServer } from "http";
config();

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});
// Middleware
app.use(express.json());
app.use(
  cors({
    origin: ["https://pop-utka.vercel.app", "http://localhost:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  })
);
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

    console.log(`Emitting message to chat:${chatId}`, message.text);

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

app.use(cookieParser());

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
app.use("/reviews", reviewRoutes);
app.use("/notifications", notificationRoutes);
app.use("/chats", chatRoutes);

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

    // НАСТРОЙКА АССОЦИАЦИЙ ПЕРЕД СИНХРОНИЗАЦИЕЙ
    setupAssociations();

    await sequelize.sync();
    console.log("Database synchronized");

    server.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Error connecting to PostgreSQL:", error);
  }
};

startServer();
