import express from "express";
import { paymentCallback } from "../controllers/paymentController";
import { requireInternalSecret } from "../middleware/internalAuth";

const router = express.Router();

// Эндпоинт для колбэка от платежного сервиса (защищён общим секретом)
router.post("/callback", requireInternalSecret, paymentCallback);

export default router;
