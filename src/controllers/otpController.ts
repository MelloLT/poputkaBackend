import bcrypt from "bcrypt";
import OtpCode from "../models/OtpCode";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import axios from "axios";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

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

    return res.json({
      success: true,
      message: "Код отправлен",
      code, // ⚠️ только для dev
    });
  } catch (e: any) {
    return res.status(500).json({
      success: false,
      message: "Ошибка отправки OTP",
      error: e.message,
    });
  }
};
export const verifyOtpService = async (req: Request, res: Response) => {
  try {
    const { phone, type, inputCode, userId, userRole } = req.body;

    if (!phone || !type || !inputCode) {
      return res.status(400).json({
        success: false,
        message: "phone, type и inputCode обязательны",
      });
    }

    if (!userId || !userRole) {
      return res.status(400).json({
        success: false,
        message: "userId и userRole обязательны",
      });
    }

    const otp = await OtpCode.findOne({ where: { phone, type } });

    if (!otp) {
      return res.status(404).json({
        success: false,
        message: "Код не найден или уже использован",
      });
    }

    if (new Date() > otp.expiresAt) {
      await otp.destroy();

      return res.status(410).json({
        success: false,
        message: "Код истёк",
      });
    }

    if (otp.attempts >= otp.maxAttempts) {
      await otp.destroy();

      return res.status(429).json({
        success: false,
        message: "Слишком много попыток, запросите новый код",
      });
    }

    const isValid = await bcrypt.compare(inputCode, otp.codeHash);

    if (!isValid) {
      await otp.update({ attempts: otp.attempts + 1 });

      return res.status(401).json({
        success: false,
        message: "Неверный код",
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

    return res.status(200).json({
      success: true,
      message: "OTP успешно подтверждён",
    });
  } catch (e: any) {
    console.error("OTP ERROR:", e); // 👈 лог обязательно

    return res.status(500).json({
      success: false,
      message: "Ошибка проверки OTP",
      error: e?.message || "Unknown error",
    });
  }
};
