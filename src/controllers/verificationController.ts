import { Request, Response } from "express";
import User from "../models/User";
import crypto from "crypto";
import { sendSuccess, sendError } from "../utils/responseHelper";
import { ErrorCodes } from "../utils/errorCodes";

const generateVerificationCode = () => {
  return crypto.randomInt(100000, 999999).toString();
};

export const sendVerificationCode = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Пользователь не найден",
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

    return sendSuccess(
      res,
      {
        code: verificationCode,
        expires: expirationTime,
      },
      ErrorCodes.VERIFICATION_CODE_SENT,
      200,
    );
  } catch (error) {
    console.error("Ошибка отправки кода:", error);
    return sendError(res, ErrorCodes.VERIFICATION_CODE_SEND_ERROR, 500);
  }
};

export const verifyCode = async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    const userId = req.user!.id;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Пользователь не найден",
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
      emailVerified: true,
      verificationCode: undefined,
      verificationCodeExpires: undefined,
    });

    return sendSuccess(
      res,
      {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          isVerified: user.isVerified,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
        },
      },
      ErrorCodes.EMAIL_VERIFIED_SUCCESS,
      200,
    );
  } catch (error) {
    console.error("Ошибка верификации:", error);
    return sendError(res, ErrorCodes.EMAIL_VERIFICATION_ERROR, 500);
  }
};

export const verifyPhone = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Пользователь не найден",
      });
    }

    await user.update({
      phoneVerified: true,
    });

    return sendSuccess(
      res,
      {
        user: {
          id: user.id,
          phone: user.phone,
          phoneVerified: user.phoneVerified,
        },
      },
      ErrorCodes.PHONE_VERIFIED_SUCCESS,
      200,
    );
  } catch (error: any) {
    console.error("Ошибка верификации телефона:", error);
    return sendError(res, ErrorCodes.PHONE_VERIFICATION_ERROR, 500);
  }
};
