import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Расширяем тип Request для добавления user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Берем токен из куки
    const token = req.cookies.accessToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Токен не предоставлен",
      });
    }

    // Проверяем и расшифровываем токен
    const payload = jwt.verify(token, JWT_SECRET) as {
      userId: number;
      userRole: string;
    };

    // Сохраняем данные пользователя в req.user
    req.user = {
      id: payload.userId,
      role: payload.userRole,
    } as User;

    next();
  } catch (error) {
    console.error("Ошибка аутентификации:", error);
    return res.status(401).json({
      success: false,
      message: "Неверный или просроченный токен",
    });
  }
};

// Middleware для проверки роли
export const requireRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Требуется авторизация",
      });
    }

    if (req.user.role !== role) {
      return res.status(403).json({
        success: false,
        message: `Требуется роль: ${role}`,
      });
    }

    next();
  };
};
