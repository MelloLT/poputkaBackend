import express from "express";

import {
  getChats,
  getChatByID,
  sendMessage,
  createChat,
} from "../controllers/chatsController";
import { authMiddleware } from "../middleware/auth";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getChats);
router.get("/:id", getChatByID);
router.post("/", createChat);
router.post("/:id/messages", sendMessage);

export default router;
