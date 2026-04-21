import express from "express";
import { paymentCallback } from "../controllers/paymentController";

const router = express.Router();

// Эндпоинт для колбэка от платежного сервиса
router.post("/callback", paymentCallback);

export default router;
