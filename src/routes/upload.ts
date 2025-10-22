import express from "express";
import {
  uploadAvatar,
  uploadCarPhotos,
  deleteFile,
} from "../controllers/uploadController";
import { authMiddleware } from "../middleware/auth";
import {
  uploadAvatar as uploadAvatarMiddleware,
  uploadCarPhotos as uploadCarPhotosMiddleware,
} from "../middleware/upload";

const router = express.Router();

// Загрузка аватара (один файл)
router.post(
  "/avatar",
  authMiddleware,
  uploadAvatarMiddleware.single("avatar"),
  uploadAvatar
);

// Загрузка фото автомобиля (несколько файлов)
router.post(
  "/car",
  authMiddleware,
  uploadCarPhotosMiddleware.array("photos", 5),
  uploadCarPhotos
);

// Удаление файла
router.delete("/file", authMiddleware, deleteFile);

export default router;
