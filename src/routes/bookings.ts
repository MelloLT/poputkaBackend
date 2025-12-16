import express from "express";
import {
  createBooking,
  getMyBookings,
  cancelBooking,
  getBookingById, // Добавляем импорт
} from "../controllers/bookingController";
import { authMiddleware } from "../middleware/auth";

const router = express.Router();

router.use(authMiddleware);

router.post("/", createBooking);
router.get("/me", getMyBookings);
router.get("/:id", getBookingById); // Новый роут
router.delete("/:id", cancelBooking);

export default router;
