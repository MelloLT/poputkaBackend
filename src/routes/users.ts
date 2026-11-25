import express from "express";
import {
  getUsers,
  getUserById,
  getDrivers,
  updateCar,
  updateProfile,
} from "../controllers/userController";
import { authMiddleware, requireAdminSilent } from "../middleware/auth";

const router = express.Router();

// Полный список пользователей — только для админа. Раньше api.pop-utka.uz/users отдавал его всем.
// Чужим — пустой 401/403 без пояснений.
router.get("/", requireAdminSilent, getUsers);
router.get("/drivers", getDrivers);
router.get("/:id", getUserById);

router.use(authMiddleware);
router.patch("/me/car", updateCar);
router.patch("/me", updateProfile);

export default router;
