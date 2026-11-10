import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { z } from "zod";
import Chat from "./models/Chat";
import Message from "./models/Message";
import { socketAuthMiddleware } from "./middleware/socketAuth";
import { env } from "./config/env";
import { logger } from "./config/logger";

const MAX_MESSAGE_LENGTH = 2000;
const MAX_MESSAGES_PER_10S = 20;

const messageSchema = z.object({
  chatId: z.coerce.string().min(1).max(64),
  text: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH),
});
const chatIdSchema = z.coerce.string().min(1).max(64);

const isChatMember = async (chatId: string, userId: string) => {
  const chat = await Chat.findByPk(chatId, { attributes: ["id", "user1Id", "user2Id"] });
  return Boolean(chat && (chat.user1Id === userId || chat.user2Id === userId));
};

let ioInstance: Server | null = null;

/** Текущий socket.io сервер (null в тестах / до старта). Заменяет циклический импорт из index.ts. */
export const getIO = (): Server | null => ioInstance;

export const createSocketServer = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: env.corsOrigins, methods: ["GET", "POST"], credentials: true },
    maxHttpBufferSize: 1e5,
  });

  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    const user = socket.data.user;
    const userId: string = user.id;
    socket.join(`notifications:${userId}`);
    logger.debug({ userId }, "socket connected");

    // простое ограничение частоты сообщений на сокет
    let windowStart = Date.now();
    let sentInWindow = 0;
    const allowedToSend = () => {
      const now = Date.now();
      if (now - windowStart > 10_000) {
        windowStart = now;
        sentInWindow = 0;
      }
      return ++sentInWindow <= MAX_MESSAGES_PER_10S;
    };

    socket.on("join-chat", async (rawChatId: unknown, ack?: (r: { ok: boolean }) => void) => {
      try {
        const chatId = chatIdSchema.parse(rawChatId);
        if (!(await isChatMember(chatId, userId))) {
          return ack?.({ ok: false });
        }
        socket.join(`chat:${chatId}`);
        ack?.({ ok: true });
      } catch {
        ack?.({ ok: false });
      }
    });

    socket.on("send-message", async (payload: unknown, ack?: (r: { ok: boolean; error?: string }) => void) => {
      try {
        if (!allowedToSend()) return ack?.({ ok: false, error: "RATE_LIMITED" });

        const parsed = messageSchema.safeParse(payload);
        if (!parsed.success) return ack?.({ ok: false, error: "INVALID_MESSAGE" });
        const { chatId, text } = parsed.data;

        if (!(await isChatMember(chatId, userId))) {
          return ack?.({ ok: false, error: "FORBIDDEN" });
        }

        const message = await Message.create({ chatId, senderId: userId, text });

        io.to(`chat:${chatId}`).emit("new-message", {
          id: message.id,
          chatId,
          senderId: userId,
          senderName: user.username || "Unknown",
          text,
          createdAt: message.createdAt,
        });
        ack?.({ ok: true });
      } catch (err) {
        logger.error({ err, userId }, "send-message failed");
        ack?.({ ok: false, error: "SERVER_ERROR" });
      }
    });
  });

  ioInstance = io;
  return io;
};
