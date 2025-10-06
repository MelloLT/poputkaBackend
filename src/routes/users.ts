import express from "express";
import {
  getUsers,
  getUserById,
  getDrivers,
  updateUser,
} from "../controllers/userController";
import { authMiddleware } from "../middleware/auth";

const router = express.Router();

// Публичные роуты
router.get("/", getUsers);
router.get("/drivers", getDrivers);
router.get("/:id", getUserById);

// Защищенные роуты
router.patch("/:id", authMiddleware, updateUser);

export default router;
