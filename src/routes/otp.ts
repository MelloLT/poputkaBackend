import express from "express";
import { sendOtpService, verifyOtpService } from "../controllers/otpController";

const router = express.Router();


router.post("/", sendOtpService);
router.post("/verify", verifyOtpService);

export default router;
