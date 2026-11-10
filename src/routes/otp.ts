import express from "express";
import { sendOtpService, verifyOtpService } from "../controllers/otpController";
import { otpSendLimiter, otpVerifyLimiter } from "../middleware/rateLimit";

const router = express.Router();

router.post("/", otpSendLimiter, sendOtpService);
router.post("/verify", otpVerifyLimiter, verifyOtpService);

export default router;
