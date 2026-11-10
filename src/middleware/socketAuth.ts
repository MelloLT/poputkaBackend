import { Socket } from "socket.io";
import * as cookie from "cookie";
import User from "../models/User";
import { verifyToken } from "../utils/token";
import { logger } from "../config/logger";

export const socketAuthMiddleware = async (
  socket: Socket,
  next: (err?: Error) => void,
) => {
  try {
    const cookieHeader = socket.handshake.headers.cookie;
    if (!cookieHeader) return next(new Error("UNAUTHORIZED"));

    const token = cookie.parse(cookieHeader).accessToken;
    if (!token) return next(new Error("UNAUTHORIZED"));

    const payload = verifyToken(token);

    const user = await User.findByPk(payload.userId, {
      attributes: {
        exclude: ["password", "verificationCode", "verificationCodeExpires"],
      },
    });

    if (!user) return next(new Error("UNAUTHORIZED"));

    socket.data.user = user;
    next();
  } catch (err) {
    logger.debug({ err }, "socket auth failed");
    next(new Error("UNAUTHORIZED"));
  }
};
