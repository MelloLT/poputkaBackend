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

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Проверяем token из cookies или заголовка Authorization
    let token = req.cookies?.accessToken;

    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Токен не предоставлен",
      });
    }

    const payload = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      userRole: string;
    };

    const user = await User.findByPk(payload.userId, {
      attributes: {
        exclude: ["password", "verificationCode", "verificationCodeExpires"],
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Пользователь не найден",
      });
    }

    // Проверка на бан
    if (user.isBanned) {
      const now = new Date();
      if (user.bannedUntil && user.bannedUntil > now) {
        return res.status(403).json({
          success: false,
          message: `Ваш аккаунт заблокирован. Причина: ${
            user.banReason || "нарушение правил"
          }. Блокировка до: ${user.bannedUntil.toLocaleDateString()}`,
        });
      } else if (!user.bannedUntil) {
        // Перманентный бан
        return res.status(403).json({
          success: false,
          message: `Ваш аккаунт заблокирован навсегда. Причина: ${
            user.banReason || "нарушение правил"
          }`,
        });
      }
    }

    req.user = user;
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

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Требуется авторизация",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Требуются права администратора",
    });
  }

  next();
};
