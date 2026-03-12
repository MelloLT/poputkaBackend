import express from "express";
import {
  getTrips,
  createTrip,
  updateTrip,
  deleteTrip,
  getTripById,
  completeTrip,
} from "../controllers/tripController";
import { authMiddleware, requireRole } from "../middleware/auth";
import { checkFutureTrip } from "../middleware/validation";

const router = express.Router();

// Публичные роуты
router.get("/", getTrips);
router.get("/:id", getTripById);

// Защищенные роуты
router.post(
  "/",
  authMiddleware,
  requireRole("driver"),
  checkFutureTrip,
  createTrip
);
router.patch(
  "/:id",
  authMiddleware,
  requireRole("driver"),
  checkFutureTrip,
  updateTrip
);
router.delete("/:id", authMiddleware, requireRole("driver"), deleteTrip);
router.patch(
  "/:id/complete",
  authMiddleware,
  requireRole("driver"),
  completeTrip
);

export default router;
