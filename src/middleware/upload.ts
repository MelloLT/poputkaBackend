import multer from "multer";
import path from "path";
import { Request } from "express";

// Настройка хранилища для аватаров
const avatarStorage = multer.diskStorage({
  destination: (req: Request, file, cb) => {
    cb(null, "src/uploads/avatars/");
  },
  filename: (req: Request, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "avatar-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// Настройка хранилища для фото автомобилей
const carStorage = multer.diskStorage({
  destination: (req: Request, file, cb) => {
    cb(null, "src/uploads/cars/");
  },
  filename: (req: Request, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "car-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// Фильтр файлов
const fileFilter = (req: Request, file: Express.Multer.File, cb: any) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Можно загружать только изображения!"), false);
  }
};

// Создание экземпляры multer
export const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

export const uploadCarPhotos = multer({
  storage: carStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5, // максимум 5 файлов
  },
});
