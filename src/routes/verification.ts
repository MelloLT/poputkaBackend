import express from "express";
import {
  sendVerificationCode,
  verifyCode,
} from "../controllers/verificationController";
import { auth } from "../middleware/auth";

const router = express.Router();

router.post("/send", auth, sendVerificationCode);
router.post("/verify", auth, verifyCode);

export default router;
