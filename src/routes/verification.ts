import express from "express";
import {
  sendVerificationCode,
  verifyCode,
  verifyPhone,
} from "../controllers/verificationController";
import { authMiddleware } from "../middleware/auth";

const router = express.Router();

router.post("/send", authMiddleware, sendVerificationCode);
router.post("/verify", authMiddleware, verifyCode);
router.post("/phone", authMiddleware, verifyPhone);

export default router;
