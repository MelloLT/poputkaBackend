import express from "express";
import { resetPassword } from "../controllers/passwordController";
import { otpVerifyLimiter } from "../middleware/rateLimit";
const router = express.Router();

router.post("/reset", otpVerifyLimiter, resetPassword);

export default router;
