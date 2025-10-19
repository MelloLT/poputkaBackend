import { Request, Response } from "express";
import User from "../models/User";
import crypto from "crypto";

const generateVerificationCode = () => {
  return crypto.randomInt(100000, 999999).toString();
};

export const sendVerificationCode = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Пользователь не найден",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Пользователь уже верифицирован",
      });
    }

    const verificationCode = generateVerificationCode();
    const expirationTime = new Date(Date.now() + 15 * 60 * 1000);

    await user.update({
      verificationCode,
      verificationCodeExpires: expirationTime,
    });

    console.log(`Код подтверждения для ${user.email}: ${verificationCode}`);
    console.log(`Код действителен до: ${expirationTime}`);

    res.json({
      success: true,
      message: "Код подтверждения отправлен",
      data: {
        code: verificationCode,
        expires: expirationTime,
      },
    });
  } catch (error) {
    console.error("Ошибка отправки кода:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка при отправке кода",
    });
  }
};

export const verifyCode = async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    const userId = req.user!.userId;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Пользователь не найден",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Пользователь уже верифицирован",
      });
    }

    if (!user.verificationCode || !user.verificationCodeExpires) {
      return res.status(400).json({
        success: false,
        message: "Код не был отправлен",
      });
    }

    if (user.verificationCode !== code) {
      return res.status(400).json({
        success: false,
        message: "Неверный код подтверждения",
      });
    }

    if (user.verificationCodeExpires < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Срок действия кода истек",
      });
    }

    await user.update({
      isVerified: true,
      verificationCode: undefined,
      verificationCodeExpires: undefined,
    });

    res.json({
      success: true,
      message: "Email успешно подтвержден!",
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          isVerified: user.isVerified,
        },
      },
    });
  } catch (error) {
    console.error("Ошибка верификации:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка при верификации",
    });
  }
};
