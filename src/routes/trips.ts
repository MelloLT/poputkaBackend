import express from "express";
import {
  getTrips,
  createTrip,
  updateTrip,
  deleteTrip,
} from "../controllers/tripController";
import { auth } from "../middleware/auth";

const router = express.Router();

router.get("/", getTrips);
// Пока закомментируем auth чтобы тестировать без авторизации
// router.post("/", auth, createTrip);
// router.patch("/:id", auth, updateTrip);
// router.delete("/:id", auth, deleteTrip);

router.post("/", createTrip);
router.patch("/:id", updateTrip);
router.delete("/:id", deleteTrip);

export default router; // ✅ Добавляем default export
