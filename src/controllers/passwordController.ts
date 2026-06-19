import { Request, Response } from "express";
import { Op } from "sequelize";
import User from "../models/User";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { ErrorCodes } from "../utils/errorCodes";
import { sendError, sendSuccess } from "../utils/responseHelper";

// Генерация случайного кода
const generateResetCode = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Запрос на сброс пароля
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return sendError(res, ErrorCodes.EMAIL_REQUIRED, 400);
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return sendSuccess(res, null, ErrorCodes.PASSWORD_RESET_EMAIL_SENT, 200);
    }

    const resetCode = generateResetCode();
    const resetCodeExpires = new Date(Date.now() + 15 * 60 * 1000);

    await user.update({
      verificationCode: resetCode,
      verificationCodeExpires: resetCodeExpires,
    });

    console.log(`Код для сброса пароля для ${email}: ${resetCode}`);

    return sendSuccess(
      res,
      null,
      ErrorCodes.PASSWORD_RESET_EMAIL_SENT,
      200,
      process.env.NODE_ENV === "development" ? { code: resetCode } : undefined,
    );
  } catch (error) {
    console.error("Ошибка запроса сброса пароля:", error);
    return sendError(res, ErrorCodes.PASSWORD_RESET_ERROR, 500);
  }
};

// Проверка кода
export const verifyResetCode = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return sendError(res, ErrorCodes.VERIFICATION_FIELDS_REQUIRED, 400);
    }

    const user = await User.findOne({
      where: {
        email,
        verificationCode: code,
        verificationCodeExpires: { [Op.gt]: new Date() },
      },
    });

    if (!user) {
      return sendError(res, ErrorCodes.INVALID_OR_EXPIRED_CODE, 400);
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    await user.update({
      verificationCode: resetToken,
    });

    return sendSuccess(
      res,
      { resetToken },
      ErrorCodes.CODE_VERIFIED_SUCCESS,
      200,
    );
  } catch (error) {
    console.error("Ошибка проверки кода:", error);
    return sendError(res, ErrorCodes.PASSWORD_RESET_ERROR, 500);
  }
};

// Сброс пароля
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return sendError(res, ErrorCodes.PASSWORD_RESET_FIELDS_REQUIRED, 400);
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d._-]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return sendError(res, ErrorCodes.INVALID_PASSWORD_FORMAT, 400);
    }

    const user = await User.findOne({
      where: {
        verificationCode: resetToken,
      },
    });

    if (!user) {
      return sendError(res, ErrorCodes.INVALID_RESET_TOKEN, 400);
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await user.update({
      password: hashedPassword,
      verificationCode: undefined,
      verificationCodeExpires: undefined,
    });

    return sendSuccess(res, null, ErrorCodes.PASSWORD_RESET_SUCCESS, 200);
  } catch (error) {
    console.error("Ошибка сброса пароля:", error);
    return sendError(res, ErrorCodes.PASSWORD_RESET_ERROR, 500);
  }
};
