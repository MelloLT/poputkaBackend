import express from "express";
import { register, login, getMe, logout } from "../controllers/authController";
import { authMiddleware } from "../middleware/auth";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authMiddleware, getMe);
router.post("/logout", logout);

export default router;
