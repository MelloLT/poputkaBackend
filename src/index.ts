import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import sequelize from "./config/database";
import authRoutes from "./routes/auth";
import verificationRoutes from "./routes/verification";
import tripRoutes from "./routes/trips"; // Импортируем поездки

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Маршруты
app.use("/auth", authRoutes);
app.use("/verification", verificationRoutes);
app.use("/trips", tripRoutes); // Добавляем поездки

app.get("/", (req, res) => {
  res.json({ message: "✅ Бэкенд Poputka работает!" });
});

// Простой тестовый маршрут
app.get("/test", (req, res) => {
  res.json({ message: "✅ Тестовый маршрут работает!" });
});

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Connected to PostgreSQL successfully");

    await sequelize.sync({ force: false });
    console.log("✅ Database synchronized");

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Error connecting to PostgreSQL:", error);
  }
};

startServer();
