import express from "express";
import {
  createBooking,
  cancelBooking,
  getBookingById,
} from "../controllers/bookingController";
import { authMiddleware } from "../middleware/auth";
import {
  checkSelfBooking,
  checkTripActive,
  checkMaxBookings,
  checkFutureTrip,
} from "../middleware/validation";

const router = express.Router();

// Применяем middleware в правильном порядке
router.post(
  "/",
  authMiddleware,
  checkSelfBooking,
  checkTripActive,
  checkMaxBookings,
  createBooking
);

router.get("/:id", authMiddleware, getBookingById);
router.delete("/:id", authMiddleware, cancelBooking);

export default router;
