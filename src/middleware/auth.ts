import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { sendError } from "../utils/responseHelper";
import { ErrorCodes } from "../utils/errorCodes";

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
  next: NextFunction,
) => {
  try {
    // Проверяем token из cookies или заголовка Authorization
    let token = req.cookies?.accessToken;

    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return sendError(res, ErrorCodes.TOKEN_NOT_PROVIDED, 401);
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
      return sendError(res, ErrorCodes.USER_NOT_FOUND, 401);
    }

    // Проверка на бан (user точно не null на этом этапе)
    if (user.isBanned) {
      const now = new Date();
      if (user.bannedUntil && user.bannedUntil > now) {
        return sendError(res, ErrorCodes.USER_BANNED_TEMPORARY, 403, {
          bannedUntil: user.bannedUntil.toISOString(),
          reason: user.banReason || undefined,
        });
      } else if (!user.bannedUntil) {
        return sendError(res, ErrorCodes.USER_BANNED_PERMANENT, 403, {
          reason: user.banReason || undefined,
        });
      }
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Ошибка аутентификации:", error);
    return sendError(res, ErrorCodes.INVALID_OR_EXPIRED_TOKEN, 401);
  }
};

export const requireRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, ErrorCodes.AUTHORIZATION_REQUIRED, 401);
    }

    if (req.user.role !== role) {
      return sendError(res, ErrorCodes.ROLE_REQUIRED, 403, {
        requiredRole: role,
        currentRole: req.user.role,
      });
    }

    next();
  };
};

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return sendError(res, ErrorCodes.AUTHORIZATION_REQUIRED, 401);
  }

  if (req.user.role !== "admin") {
    return sendError(res, ErrorCodes.ADMIN_RIGHTS_REQUIRED, 403);
  }

  next();
};
