import express from "express";
import {
  getUsers,
  getUserById,
  getDrivers,
  updateUser,
  updateCar,
  updateProfile,
} from "../controllers/userController";
import { authMiddleware } from "../middleware/auth";

const router = express.Router();

router.get("/", getUsers);
router.get("/drivers", getDrivers);
router.get("/:id", getUserById);

router.patch("/:id", authMiddleware, updateUser);
router.patch("/:id/car", authMiddleware, updateCar);
router.patch("/:id/profile", authMiddleware, updateProfile);

export default router;
