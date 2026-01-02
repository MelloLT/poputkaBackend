import express from "express";
import {
  getAllUsers,
  banUser,
  unbanUser,
  deleteUser,
  reportUser,
  getAllReports,
  updateReportStatus,
  getAdminStats,
} from "../controllers/adminController";
import { authMiddleware, requireAdmin } from "../middleware/auth";

const router = express.Router();

// Жалобы доступны всем авторизованным пользователям
router.post("/reports", authMiddleware, reportUser);

// Остальные роуты только для админов
router.use(authMiddleware, requireAdmin);

// Управление пользователями
router.get("/users", getAllUsers);
router.post("/users/:userId/ban", banUser);
router.post("/users/:userId/unban", unbanUser);
router.delete("/users/:userId", deleteUser);

// Жалобы
router.get("/reports", getAllReports);
router.patch("/reports/:userId/:reportId", updateReportStatus);

// Статистика
router.get("/stats", getAdminStats);

export default router;
