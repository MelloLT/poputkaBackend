import express from "express";
import {
  createBooking,
  getMyBookings,
  cancelBooking,
  getPassengerTripHistory,
  getPassengerActiveTrips,
  getBookingById, // Добавляем импорт
} from "../controllers/bookingController";
import { authMiddleware } from "../middleware/auth";

const router = express.Router();

router.use(authMiddleware);

router.post("/", createBooking);
router.get("/me", getMyBookings);
router.get("/:id", getBookingById); // Новый роут
router.delete("/:id", cancelBooking);
router.get("/passenger/history", getPassengerTripHistory);
router.get("/passenger/active", getPassengerActiveTrips);

export default router;
