import express from "express";
import {
  getUsers,
  getUserById,
  getDrivers,
  updateCar,
  updateProfile,
} from "../controllers/userController";
import { authMiddleware } from "../middleware/auth";

const router = express.Router();

router.get("/", getUsers);
router.get("/drivers", getDrivers);
router.get("/:id", getUserById);

router.use(authMiddleware);
router.patch("/me/car", updateCar);
router.patch("/me", updateProfile);

export default router;
