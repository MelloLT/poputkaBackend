import { getIO } from "../socket";

/** Отправка уведомления в реальном времени (молча пропускает, если сокет-сервер не запущен). */
export const pushNotification = (userId: string, notif: unknown) => {
  getIO()?.to(`notifications:${userId}`).emit("new-notification", notif);
};
