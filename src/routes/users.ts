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
import { checkProfileOwnership } from "../middleware/validation";

const router = express.Router();

router.get("/", getUsers);
router.get("/drivers", getDrivers);
router.get("/:id", getUserById);

router.use(authMiddleware);
router.patch("/:id", checkProfileOwnership, updateUser);
router.patch("/:id/car", checkProfileOwnership, updateCar);
router.patch("/:id/profile", checkProfileOwnership, updateProfile);

export default router;
