import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import User from "../models/User";
import { sendSuccess, sendError } from "../utils/responseHelper";
import { ErrorCodes } from "../utils/errorCodes";

const uploadsDir = path.join(process.cwd(), "uploads");

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

    await User.update({ avatar: fileUrl }, { where: { id: userId } });

    sendSuccess(
      res,
      { avatar: fileUrl },
      ErrorCodes.AVATAR_UPLOADED_SUCCESS,
      200,
    );
  } catch (error) {
    console.error("Ошибка загрузки аватара:", error);
    sendError(res, ErrorCodes.AVATAR_UPLOAD_ERROR, 500);
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

    const user = await User.findByPk(userId);
    if (user) {
      let updatedCar;

      if (user.car) {
        updatedCar = {
          ...user.car,
          photos: [...(user.car.photos || []), ...uploadedFiles],
        };
      } else {
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

    return sendSuccess(
      res,
      { carPhotos: uploadedFiles },
      ErrorCodes.CAR_PHOTOS_UPLOADED_SUCCESS,
      200,
    );
  } catch (error) {
    console.error("Ошибка загрузки фото автомобиля:", error);
    return sendError(res, ErrorCodes.CAR_PHOTOS_UPLOAD_ERROR, 500);
  }
};

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

    const filename = fileUrl.split("/").pop();
    let folder = "";

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

    const filePath = path.join(uploadsDir, folder, filename!);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);

      const user = await User.findByPk(userId);

      if (user) {
        if (folder === "avatars" && user.avatar === fileUrl) {
          await User.update({ avatar: "" }, { where: { id: userId } });
        } else if (folder === "cars" && user.car?.photos) {
          const updatedPhotos = user.car.photos.filter(
            (photo: string) => photo !== fileUrl,
          );
          const updatedCar = { ...user.car, photos: updatedPhotos };
          await User.update({ car: updatedCar }, { where: { id: userId } });
        }
      }

      return sendSuccess(
        res,
        { deletedUrl: fileUrl },
        ErrorCodes.FILE_DELETED_SUCCESS,
        200,
      );
    }

    return sendError(res, ErrorCodes.FILE_NOT_FOUND, 404);
  } catch (error) {
    console.error("Ошибка удаления файла:", error);
    return sendError(res, ErrorCodes.FILE_DELETE_ERROR, 500);
  }
};
