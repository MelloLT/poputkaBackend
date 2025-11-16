import express from "express";
import {
  getTrips,
  createTrip,
  updateTrip,
  deleteTrip,
  getTripById,
  completeTrip,
  getDriverTripHistory,
} from "../controllers/tripController";
import { authMiddleware, requireRole } from "../middleware/auth";

const router = express.Router();

// Публичные роуты
router.get("/", getTrips);
router.get("/:id", getTripById);

// Защищенные роуты - требуют авторизации
router.use(authMiddleware);

// Только водители могут создавать/редактировать/удалять поездки
router.post("/", requireRole("driver"), createTrip);
router.patch("/:id", requireRole("driver"), updateTrip);
router.delete("/:id", requireRole("driver"), deleteTrip);
router.patch("/:id/complete", requireRole("driver"), completeTrip);
router.get("/driver/history", requireRole("driver"), getDriverTripHistory);

export default router;
