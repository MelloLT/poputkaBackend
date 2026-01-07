import { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import * as cookie from "cookie";
import User from "../models/User";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export const socketAuthMiddleware = async (
  socket: Socket,
  next: (err?: Error) => void
) => {
  try {
    const cookieHeader = socket.handshake.headers.cookie;
    console.log("handshake.headers.cookie:", cookieHeader);
    if (!cookieHeader) return next(new Error("Нет cookie"));

    const cookies = cookie.parse(cookieHeader);
    const token = cookies.accessToken;
    if (!token) return next(new Error("Токен не предоставлен"));

    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };

    const user = await User.findByPk(payload.userId, {
      attributes: {
        exclude: ["password", "verificationCode", "verificationCodeExpires"],
      },
    });

    if (!user) return next(new Error("Пользователь не найден"));

    socket.data.user = user;

    next();
  } catch (err) {
    console.error("Ошибка авторизации сокета:", err);
    next(new Error("Неверный или просроченный токен"));
  }
};
