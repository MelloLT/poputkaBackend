import express from "express";
import {
  forgotPassword,
  verifyResetCode,
  resetPassword,
} from "../controllers/passwordController";

const router = express.Router();

router.post("/forgot", forgotPassword);
router.post("/verify", verifyResetCode);
router.post("/reset", resetPassword);

export default router;
