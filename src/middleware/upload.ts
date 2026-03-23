import multer from "multer";
import path from "path";
import fs from "fs";

// Универсальный путь к uploads
const uploadsDir = path.join(process.cwd(), "uploads");

// Создаем папки если их нет
const ensureDirExists = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Настройка хранилища для аватаров
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const avatarDir = path.join(uploadsDir, "avatars");
    ensureDirExists(avatarDir);
    cb(null, avatarDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "avatar-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// Настройка хранилища для фото автомобилей
const carStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const carsDir = path.join(uploadsDir, "cars");
    ensureDirExists(carsDir);
    cb(null, carsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "car-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// Фильтр файлов
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Можно загружать только изображения!"), false);
  }
};

// Создание экземпляров multer
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
    files: 5,
  },
});
