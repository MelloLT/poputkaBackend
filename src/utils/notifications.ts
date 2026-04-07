import { Server } from "socket.io";

export const pushNotification = (io: Server, userId: string, notif: any) => {
  io.to(`notifications:${userId}`).emit("new-notification", notif);
  console.log(`Pushed notification to ${userId}:`, notif);
};
