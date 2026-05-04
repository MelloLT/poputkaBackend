import express from "express";
import { sendOtpService, verifyOtpService } from "../controllers/otpController";
// import { authMiddleware } from "../middleware/auth";

const router = express.Router();

// router.use(authMiddleware);

router.post("/", sendOtpService);
router.post("/verify", verifyOtpService);

export default router;
