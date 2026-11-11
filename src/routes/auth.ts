import express from "express";
import {
  register,
  login,
  getMe,
  logout,
  checkRegister,
  checkRecover,
} from "../controllers/authController";
import { authMiddleware } from "../middleware/auth";
import { authLimiter } from "../middleware/rateLimit";

const router = express.Router();

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.get("/me", authMiddleware, getMe);
router.post("/logout", logout);
router.post("/check-register", authLimiter, checkRegister);
router.post("/check-recover", authLimiter, checkRecover);

export default router;
