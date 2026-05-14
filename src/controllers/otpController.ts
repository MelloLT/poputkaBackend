import bcrypt from "bcrypt";
import OtpCode from "../models/OtpCode";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import axios from "axios";
import { ErrorCodes } from "../utils/errorCodes";
import { sendError, sendSuccess } from "../utils/responseHelper";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
export const sendSmsCode = async (phone: string, code: string) => {
  try {
    const response = await axios.post(
      "http://185.8.212.184/smsgateway/",
      new URLSearchParams({
        login: "Creditasia",
        password: "q7tDuogeunJW9M7474v4",
        data: JSON.stringify([
          {
            phone: "998901148203",
            text: `PopUtka kod avtorizacii na saite: ${code}`,
          },
        ]),
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error("GETSMS ERROR", error);
    throw error;
  }
};
const generateToken = (userId: string, userRole: string) => {
  return jwt.sign({ userId, userRole }, JWT_SECRET, { expiresIn: "7d" });
};
export const sendOtpService = async (req: Request, res: Response) => {
  try {
    const { phone, type } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Phone обязателен" });
    }

    if (!type) {
      return res.status(400).json({ message: "Type обязателен" });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = await bcrypt.hash(code, 10);

    await OtpCode.upsert({
      phone,
      type,
      codeHash,
      attempts: 0,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      maxAttempts: 2,
    });
    // const coderes = await sendSmsCode(phone, code);
    return sendSuccess(res, { code: code }, ErrorCodes.OTP_SENT_SUCCESS, 200);
  } catch (e: any) {
    return sendError(res, ErrorCodes.OTP_SEND_ERROR, 500);
  }
};
export const verifyOtpService = async (req: Request, res: Response) => {
  try {
    const { phone, type, inputCode, userId, userRole } = req.body;

    if (!phone || !type || !inputCode) {
      return sendError(res, ErrorCodes.OTP_REQUIRED_FIELDS, 400);
    }

    if (!userId || !userRole) {
      return sendError(res, ErrorCodes.OTP_USERID_REQUIRED, 400);
    }

    const otp = await OtpCode.findOne({ where: { phone, type } });

    if (!otp) {
      return sendError(res, ErrorCodes.OTP_NOT_FOUND, 404);
    }

    if (new Date() > otp.expiresAt) {
      await otp.destroy();

      return sendError(res, ErrorCodes.OTP_EXPIRED, 410);
    }

    if (otp.attempts >= otp.maxAttempts) {
      await otp.destroy();

      return sendError(res, ErrorCodes.OTP_TOO_MANY_ATTEMPTS, 429);
    }

    const isValid = await bcrypt.compare(inputCode, otp.codeHash);

    if (!isValid) {
      await otp.update({ attempts: otp.attempts + 1 });

      return sendError(res, ErrorCodes.OTP_INVALID_CODE, 401, {
        attemptsLeft: Math.max(0, otp.maxAttempts - otp.attempts - 1),
      });
    }

    await otp.destroy();

    const token = generateToken(userId, userRole);

    res.cookie("accessToken", token, {
      domain: ".pop-utka.uz",
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24,
    });

    return sendSuccess(res, null, ErrorCodes.OTP_VERIFIED_SUCCESS, 200);
  } catch (e: any) {
    console.error("OTP ERROR:", e);

    // return res.status(500).json({
    //   success: false,
    //   message: "Ошибка проверки OTP",
    //   error: e?.message || "Unknown error",
    // });
    return sendError(res, ErrorCodes.OTP_VERIFY_ERROR, 500, {
      error: e?.message || "Unknown error",
    });
  }
};
