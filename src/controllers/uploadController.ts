import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import User from "../models/User";

export const uploadAvatar = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Файл не был загружен",
      });
    }

    const userId = req.user!.id;
    const fileUrl = `/uploads/avatars/${req.file.filename}`;

    // Обновляем аватар
    await User.update({ avatar: fileUrl }, { where: { id: userId } });

    res.json({
      success: true,
      message: "Аватар успешно загружен",
      data: {
        avatar: fileUrl, // ✅ ТОЛЬКО НОВЫЙ URL АВАТАРА
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

    const userId = req.user!.id;
    const files = req.files as Express.Multer.File[];
    const uploadedFiles = files.map((file) => `/uploads/cars/${file.filename}`);

    // Обновляем фото автомобиля
    const user = await User.findByPk(userId);
    if (user) {
      let updatedCar;

      if (user.car) {
        // Добавляем новые фото к существующим
        updatedCar = {
          ...user.car,
          photos: [...(user.car.photos || []), ...uploadedFiles],
        };
      } else {
        // Создаем новый объект car если его нет
        updatedCar = {
          model: "Не указано",
          color: "Не указано",
          year: new Date().getFullYear(),
          licensePlate: "Не указано",
          photos: uploadedFiles,
        };
      }

      await User.update({ car: updatedCar }, { where: { id: userId } });
    }

    res.json({
      success: true,
      message: "Фотографии автомобиля успешно загружены",
      data: {
        carPhotos: uploadedFiles, // ✅ ТОЛЬКО МАССИВ НОВЫХ ФОТО
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

// 🗑️ УДАЛЕНИЕ ПО URL (КОМПАКТНАЯ ВЕРСИЯ)
export const deleteFileByUrl = async (req: Request, res: Response) => {
  try {
    const { fileUrl } = req.body;
    const userId = req.user!.id;

    if (!fileUrl) {
      return res.status(400).json({
        success: false,
        message: "URL файла обязателен",
      });
    }

    // Извлекаем filename из URL
    const filename = fileUrl.split("/").pop();
    let folder = "";

    // Определяем папку из URL
    if (fileUrl.includes("/avatars/")) {
      folder = "avatars";
    } else if (fileUrl.includes("/cars/")) {
      folder = "cars";
    } else {
      return res.status(400).json({
        success: false,
        message: "Недопустимый URL файла",
      });
    }

    const filePath = path.join(__dirname, "../uploads", folder, filename!);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);

      // Обновляем профиль
      const user = await User.findByPk(userId);

      if (user) {
        if (folder === "avatars" && user.avatar === fileUrl) {
          await User.update({ avatar: "" }, { where: { id: userId } });
        } else if (folder === "cars" && user.car?.photos) {
          const updatedPhotos = user.car.photos.filter(
            (photo: string) => photo !== fileUrl
          );
          const updatedCar = { ...user.car, photos: updatedPhotos };
          await User.update({ car: updatedCar }, { where: { id: userId } });
        }
      }

      res.json({
        success: true,
        message: "Файл успешно удален",
        data: {
          deletedUrl: fileUrl, // ✅ ТОЛЬКО URL УДАЛЕННОГО ФАЙЛА
        },
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Файл не найден",
      });
    }
  } catch (error: any) {
    console.error("Ошибка удаления файла:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка при удалении файла",
    });
  }
};
