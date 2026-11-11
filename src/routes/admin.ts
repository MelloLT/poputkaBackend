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
  getUserGrowth,
  exportUsersXlsx,
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
router.get("/stats/growth", getUserGrowth);

// Выгрузка для заказчика: открыть в браузере, будучи залогиненным админом -> скачается .xlsx
router.get("/export/users.xlsx", exportUsersXlsx);

export default router;
