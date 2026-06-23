import { Request, Response } from "express";
import User from "../models/User";
import bcrypt from "bcryptjs";
import { ErrorCodes } from "../utils/errorCodes";
import { sendError, sendSuccess } from "../utils/responseHelper";

// Сброс пароля
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { phone, newPassword } = req.body;

    if (!phone || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Все поля обязательны",
      });
    }

    // Валидация пароля
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d._-]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: "Пароль должен содержать минимум 8 символов, буквы и цифры",
      });
    }

    const user = await User.findOne({
      where: {
        phone,
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Неверный токен сброса",
      });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await user.update({
      password: hashedPassword,
    });

    return sendSuccess(res, null, ErrorCodes.PASSWORD_RESET_SUCCESS, 200);
  } catch (error) {
    console.error("Ошибка сброса пароля:", error);
    return sendError(res, ErrorCodes.PASSWORD_RESET_ERROR, 500);
  }
};
