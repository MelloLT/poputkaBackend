import express from "express";
import { resetPassword } from "../controllers/passwordController";
const router = express.Router();

router.post("/reset", resetPassword);

export default router;
