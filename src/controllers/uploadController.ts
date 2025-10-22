import { Request, Response } from "express";
import fs from "fs";
import path from "path";

export const uploadAvatar = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Файл не был загружен",
      });
    }

    // Формируем URL до файла
    const fileUrl = `/uploads/avatars/${req.file.filename}`;

    res.json({
      success: true,
      message: "Аватар успешно загружен",
      data: {
        filename: req.file.filename,
        url: fileUrl,
        size: req.file.size,
      },
    });
  } catch (error) {
    console.error("Ошибка загрузки аватара:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка при загрузке аватара",
    });
  }
};

export const uploadCarPhotos = async (req: Request, res: Response) => {
  try {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Файлы не были загружены",
      });
    }

    const files = req.files as Express.Multer.File[];
    const uploadedFiles = files.map((file) => ({
      filename: file.filename,
      url: `/uploads/cars/${file.filename}`,
      size: file.size,
    }));

    res.json({
      success: true,
      message: "Фотографии автомобиля успешно загружены",
      data: {
        files: uploadedFiles,
      },
    });
  } catch (error) {
    console.error("Ошибка загрузки фото автомобиля:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка при загрузке фотографий",
    });
  }
};

export const deleteFile = async (req: Request, res: Response) => {
  try {
    const { filename, type } = req.body; // type: 'avatar' или 'car'

    let filePath = "";
    if (type === "avatar") {
      filePath = path.join(__dirname, "../uploads/avatars", filename);
    } else if (type === "car") {
      filePath = path.join(__dirname, "../uploads/cars", filename);
    } else {
      return res.status(400).json({
        success: false,
        message: "Неверный тип файла",
      });
    }

    // Проверяем существует ли файл
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({
        success: true,
        message: "Файл успешно удален",
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Файл не найден",
      });
    }
  } catch (error) {
    console.error("Ошибка удаления файла:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка при удалении файла",
    });
  }
};
