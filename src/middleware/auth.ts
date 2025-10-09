import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

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
    const token = req.cookies.accessToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Токен не предоставлен",
      });
    }

    const payload = jwt.verify(token, JWT_SECRET) as {
      userId: number;
      userRole: string;
    };

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
