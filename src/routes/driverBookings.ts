import express from "express";
import {
  getDriverBookings,
  confirmBooking,
  rejectBooking,
} from "../controllers/driverBookingController";
import { authMiddleware, requireRole } from "../middleware/auth";

const router = express.Router();

router.use(authMiddleware, requireRole("driver"));

router.get("/", getDriverBookings);
router.patch("/:bookingId/confirm", confirmBooking);
router.patch("/:bookingId/reject", rejectBooking);

export default router;
