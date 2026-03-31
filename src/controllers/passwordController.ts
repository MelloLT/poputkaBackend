import { Request, Response } from "express";
import { Op } from "sequelize";
import User from "../models/User";
import crypto from "crypto";
import bcrypt from "bcryptjs";

// Генерация случайного кода
const generateResetCode = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Запрос на сброс пароля
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email обязателен",
      });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.json({
        success: true,
        message:
          "Если email зарегистрирован, вы получите код для сброса пароля",
      });
    }

    const resetCode = generateResetCode();
    const resetCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 минут

    await user.update({
      verificationCode: resetCode,
      verificationCodeExpires: resetCodeExpires,
    });

    // TODO: Отправить код на email (пока логируем)
    console.log(`Код для сброса пароля для ${email}: ${resetCode}`);

    res.json({
      success: true,
      message: "Если email зарегистрирован, вы получите код для сброса пароля",
      // В разработке можно вернуть код для тестирования
      ...(process.env.NODE_ENV === "development" && { code: resetCode }),
    });
  } catch (error) {
    console.error("Ошибка запроса сброса пароля:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера",
    });
  }
};

// Проверка кода
export const verifyResetCode = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: "Email и код обязательны",
      });
    }

    const user = await User.findOne({
      where: {
        email,
        verificationCode: code,
        verificationCodeExpires: { [Op.gt]: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Неверный или просроченный код",
      });
    }

    // временный токен для сброса
    const resetToken = crypto.randomBytes(32).toString("hex");

    await user.update({
      verificationCode: resetToken,
    });

    res.json({
      success: true,
      message: "Код подтвержден",
      data: { resetToken },
    });
  } catch (error) {
    console.error("Ошибка проверки кода:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера",
    });
  }
};

// Сброс пароля
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, resetToken, newPassword } = req.body;

    if (!email || !resetToken || !newPassword) {
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
        email,
        verificationCode: resetToken,
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
      verificationCode: undefined,
      verificationCodeExpires: undefined,
    });

    res.json({
      success: true,
      message: "Пароль успешно изменен",
    });
  } catch (error) {
    console.error("Ошибка сброса пароля:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера",
    });
  }
};
